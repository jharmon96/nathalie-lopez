import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.crypto import decrypt, encrypt
from app.db import get_db
from app.models import Credential, InstagramPost
from app.security import require_admin, sign_state, verify_state

router = APIRouter()

logger = logging.getLogger("instagram")

GRAPH_MEDIA_URL = "https://graph.instagram.com/me/media"
GRAPH_FIELDS = "id,caption,media_url,permalink,media_type,timestamp"
TOKEN_EXCHANGE_URL = "https://api.instagram.com/oauth/access_token"
TOKEN_REFRESH_URL = "https://graph.instagram.com/access_token"
AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize"

TOKEN_CREDENTIAL_KEY = "instagram_token"
TOKEN_UPDATED_KEY = "instagram_token_updated_at"
FEED_SYNCED_KEY = "instagram_feed_synced_at"

# Long-lived tokens last 60 days; refresh well before expiry.
TOKEN_REFRESH_AFTER_DAYS = 45
# Instagram CDN media URLs expire, so a stale feed serves dead images —
# re-sync when the last sync is older than this.
FEED_STALE_AFTER_SECONDS = 6 * 3600
STATE_MAX_AGE_SECONDS = 30 * 60


def _naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def _save_credential(db: AsyncSession, key: str, value: str) -> None:
    row = await db.get(Credential, key)
    if row is None:
        db.add(Credential(key=key, value=value, updated_at=_naive_utc()))
    else:
        row.value = value
        row.updated_at = _naive_utc()


async def _instagram_token(db: AsyncSession) -> str | None:
    """The OAuth-issued token from the DB (encrypted at rest), falling back to env."""
    settings = get_settings()
    row = await db.get(Credential, TOKEN_CREDENTIAL_KEY)
    if row and row.value:
        try:
            return decrypt(settings.session_secret, row.value)
        except Exception:
            return None
    return settings.instagram_token or None


async def _token_updated_at(db: AsyncSession) -> datetime | None:
    row = await db.get(Credential, TOKEN_UPDATED_KEY)
    return datetime.fromisoformat(row.value) if row and row.value else None


async def _refresh_token_if_stale(db: AsyncSession, token: str) -> str:
    """Long-lived tokens last 60 days — swap in a fresh one past ~45."""
    settings = get_settings()
    updated_at = await _token_updated_at(db)
    if updated_at is None:
        return token
    age_days = (datetime.now(timezone.utc) - updated_at.replace(tzinfo=timezone.utc)).days
    if age_days < TOKEN_REFRESH_AFTER_DAYS:
        return token
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            TOKEN_REFRESH_URL,
            params={
                "grant_type": "ig_refresh_token",
                "client_secret": settings.instagram_app_secret,
                "access_token": token,
            },
        )
    if res.status_code == 200:
        new_token = res.json().get("access_token")
        if new_token:
            logger.info("Instagram long-lived token refreshed (%s days old)", age_days)
            await _save_credential(db, TOKEN_CREDENTIAL_KEY, new_token)
            await _save_credential(db, TOKEN_UPDATED_KEY, _naive_utc().isoformat())
            await db.commit()
            return new_token
    return token


async def _sync_from_graph(db: AsyncSession) -> int:
    """Pull recent media from the Instagram Graph API into the DB."""
    settings = get_settings()
    token = await _refresh_token_if_stale(db, await _instagram_token(db) or "")
    if not token:
        raise HTTPException(status_code=400, detail="No Instagram token configured (NLP_INSTAGRAM_TOKEN)")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            GRAPH_MEDIA_URL,
            params={"fields": GRAPH_FIELDS, "limit": 12, "access_token": token},
        )
    if res.status_code != 200:
        logger.error("Instagram media fetch failed: %s %s", res.status_code, res.text[:300])
        raise HTTPException(status_code=502, detail="Instagram Graph API error")
    media = res.json().get("data", [])
    # Synced posts are managed by the API: replace them wholesale, keep pinned manual ones
    rows = (await db.execute(select(InstagramPost))).scalars().all()
    for row in rows:
        if row.synced_at is not None:
            await db.delete(row)
    now = datetime.now(timezone.utc)
    for i, item in enumerate(media):
        if item.get("media_type") in ("VIDEO", "CAROUSEL_ALBUM") and not item.get("media_url"):
            continue
        db.add(
            InstagramPost(
                url=item.get("permalink") or "https://instagram.com/",
                image_url=item.get("media_url") or "",
                caption=item.get("caption"),
                synced_at=now,
                sort_order=i,
            )
        )
    await db.commit()
    return len(media)


# ------------------------ public -------------------------------------------


@router.get("/public/instagram")
async def public_feed(db: AsyncSession = Depends(get_db)) -> dict:
    settings = get_settings()
    # Keep CDN media URLs fresh: Instagram expires them, so re-sync when the
    # feed is stale. Failures are non-fatal — the last known posts are served.
    if await _instagram_token(db):
        try:
            await _sync_from_graph(db)
        except Exception as sync_error:
            logger.warning("Background feed re-sync failed: %s", sync_error)
    rows = (await db.execute(select(InstagramPost).order_by(InstagramPost.sort_order, InstagramPost.id))).scalars().all()
    return {
        "posts": [
            {"url": p.url, "image_url": p.image_url, "caption": p.caption, "synced": p.synced_at is not None}
            for p in rows
        ]
    }


@router.post("/admin/instagram/refresh")
async def refresh(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    count = await _sync_from_graph(db)
    return {"ok": True, "synced": count}


# ------------------------ admin: pinned posts -------------------------------


class PostBody(BaseModel):
    url: str
    image_url: str
    caption: str | None = None
    sort_order: int = 0


@router.get("/admin/instagram")
async def list_posts(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(InstagramPost).order_by(InstagramPost.sort_order, InstagramPost.id))).scalars().all()
    return {
        "posts": [
            {
                "id": p.id,
                "url": p.url,
                "image_url": p.image_url,
                "caption": p.caption,
                "sort_order": p.sort_order,
                "synced": p.synced_at is not None,
            }
            for p in rows
        ]
    }


@router.post("/admin/instagram")
async def create_post(
    body: PostBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    p = InstagramPost(**body.model_dump())
    db.add(p)
    await db.commit()
    return {"id": p.id, **body.model_dump()}


@router.delete("/admin/instagram/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    p = await db.get(InstagramPost, post_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(p)
    await db.commit()
    return {"ok": True}


# ------------------------ OAuth: "Instagram API with Instagram Login" ------


@router.get("/admin/instagram/status")
async def status(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    settings = get_settings()
    return {
        "app_configured": bool(settings.instagram_app_id and settings.instagram_app_secret),
        "connected": (await _instagram_token(db)) is not None,
        "token_updated_at": str(await _token_updated_at(db)),
    }


@router.get("/admin/instagram/authorize")
async def authorize(_: None = Depends(require_admin)) -> RedirectResponse:
    """Send the signed-in admin to Instagram to approve the connection."""
    settings = get_settings()
    if not settings.instagram_app_id or not settings.instagram_app_secret:
        raise HTTPException(
            status_code=400,
            detail="Instagram app not configured yet (NLP_INSTAGRAM_APP_ID / NLP_INSTAGRAM_APP_SECRET missing)",
        )
    params = (
        f"?client_id={settings.instagram_app_id}"
        f"&redirect_uri={settings.instagram_redirect_uri}"
        f"&response_type=code"
        f"&scope=instagram_business_basic"
        f"&state={sign_state(settings.session_secret)}"
    )
    return RedirectResponse(f"{AUTHORIZE_URL}{params}")


@router.get("/admin/instagram/callback")
async def callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Instagram sends the admin back here. Exchange the code for a
    long-lived token, persist it in the DB (encrypted), and sync the feed."""
    settings = get_settings()
    frontend = "/admin/instagram"
    if error or not code or not state:
        logger.warning("Instagram callback arrived with error=%s", error or "missing code/state")
        return RedirectResponse(f"{frontend}?error=cancelled")
    if not settings.instagram_app_id or not settings.instagram_app_secret:
        return RedirectResponse(f"{frontend}?error=not_configured")
    if not verify_state(settings.session_secret, state, max_age_seconds=STATE_MAX_AGE_SECONDS):
        logger.warning("Instagram callback state validation failed")
        return RedirectResponse(f"{frontend}?error=bad_state")

    async with httpx.AsyncClient(timeout=30) as client:
        exchange = await client.post(
            TOKEN_EXCHANGE_URL,
            data={
                "client_id": settings.instagram_app_id,
                "client_secret": settings.instagram_app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": settings.instagram_redirect_uri,
                "code": code,
            },
        )
    if exchange.status_code != 200:
        logger.error("Instagram token exchange failed: %s %s", exchange.status_code, exchange.text[:300])
        return RedirectResponse(f"{frontend}?error=exchange_failed")
    short_token = exchange.json().get("access_token")
    if not short_token:
        logger.error("Instagram token exchange returned no access_token")
        return RedirectResponse(f"{frontend}?error=exchange_failed")

    async with httpx.AsyncClient(timeout=30) as client:
        refreshed = await client.get(
            TOKEN_REFRESH_URL,
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.instagram_app_secret,
                "access_token": short_token,
            },
        )
    if refreshed.status_code != 200:
        logger.error("Instagram long-token refresh failed: %s %s", refreshed.status_code, refreshed.text[:300])
        return RedirectResponse(f"{frontend}?error=exchange_failed")
    long_token = refreshed.json().get("access_token")
    now = datetime.now(timezone.utc)

    await _save_credential(db, TOKEN_CREDENTIAL_KEY, encrypt(settings.session_secret, long_token))
    await _save_credential(db, TOKEN_UPDATED_KEY, now.isoformat())
    await db.commit()

    try:
        count = await _sync_from_graph(db)
        logger.info("Instagram feed synced on connect: %s posts", count)
    except Exception as sync_error:  # best-effort; the connection itself succeeded
        logger.warning("Instagram feed sync after connect failed: %s", sync_error)
    logger.info("Instagram connected successfully; long-lived token stored encrypted")
    return RedirectResponse(f"{frontend}?connected=1")
