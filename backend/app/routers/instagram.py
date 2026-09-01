from datetime import datetime, timezone

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

GRAPH_MEDIA_URL = "https://graph.instagram.com/me/media"
GRAPH_FIELDS = "id,caption,media_url,permalink,media_type,timestamp"
TOKEN_CREDENTIAL_KEY = "instagram_token"
TOKEN_UPDATED_KEY = "instagram_token_updated_at"


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


class PostBody(BaseModel):
    url: str
    image_url: str
    caption: str | None = None
    sort_order: int = 0


@router.get("/public/instagram")
async def public_feed(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (await db.execute(select(InstagramPost).order_by(InstagramPost.sort_order, InstagramPost.id))).scalars().all()
    return {
        "posts": [
            {"url": p.url, "image_url": p.image_url, "caption": p.caption, "synced": p.synced_at is not None}
            for p in rows
        ]
    }


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


async def _sync_from_graph(db: AsyncSession) -> int:
    """Pull recent media from the Instagram Graph API into the DB."""
    settings = get_settings()
    token = await _instagram_token(db)
    if not token:
        raise HTTPException(status_code=400, detail="No Instagram token configured (NLP_INSTAGRAM_TOKEN)")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            GRAPH_MEDIA_URL,
            params={"fields": GRAPH_FIELDS, "limit": 12, "access_token": token},
        )
    if res.status_code != 200:
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
                url=item.get("permalink") or f"https://instagram.com/",
                image_url=item.get("media_url") or "",
                caption=item.get("caption"),
                synced_at=now,
                sort_order=i,
            )
        )
    await db.commit()
    return len(media)


@router.post("/admin/instagram/refresh")
async def refresh(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    count = await _sync_from_graph(db)
    return {"ok": True, "synced": count}


# ------------------------ OAuth: "Instagram API with Instagram Login" -------

AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize"
TOKEN_EXCHANGE_URL = "https://api.instagram.com/oauth/access_token"
TOKEN_REFRESH_URL = "https://graph.instagram.com/access_token"


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
    long-lived token, persist it in the DB, and sync the feed."""
    settings = get_settings()
    frontend = "/admin/instagram"
    if error or not code or not state:
        return RedirectResponse(f"{frontend}?error=cancelled")
    if not settings.instagram_app_id or not settings.instagram_app_secret:
        return RedirectResponse(f"{frontend}?error=not_configured")
    if not verify_state(settings.session_secret, state):
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
        return RedirectResponse(f"{frontend}?error=exchange_failed")
    short_token = exchange.json().get("access_token")
    if not short_token:
        return RedirectResponse(f"{frontend}?error=exchange_failed")

    async with httpx.AsyncClient(timeout=30) as client:
        refreshed = await client.get(
            TOKEN_REFRESH_URL,
            params={"grant_type": "ig_exchange_token", "client_secret": settings.instagram_app_secret, "access_token": short_token},
        )
    if refreshed.status_code != 200:
        return RedirectResponse(f"{frontend}?error=exchange_failed")
    long_token = refreshed.json().get("access_token")
    now = datetime.now(timezone.utc)

    async def save_credential(key: str, value: str) -> None:
        row = await db.get(Credential, key)
        if row is None:
            db.add(Credential(key=key, value=value, updated_at=now))
        else:
            row.value = value
            row.updated_at = now

    save_credential(TOKEN_CREDENTIAL_KEY, encrypt(settings.session_secret, long_token))
    save_credential(TOKEN_UPDATED_KEY, now.isoformat())
    await db.commit()

    try:
        await _sync_from_graph(db)
    except HTTPException:
        pass  # feed sync is best-effort; the connection itself succeeded
    return RedirectResponse(f"{frontend}?connected=1")
