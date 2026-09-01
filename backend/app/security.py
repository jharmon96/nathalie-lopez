import hashlib
import hmac
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import AdminSession

COOKIE_NAME = "nlp_session"
CSRF_HEADER = "X-NLP-Admin"

# Simple in-memory sliding window: fine for a single-tenant, single-replica API.
_hits: dict[str, deque[float]] = defaultdict(deque)


def throttle(key: str, limit: int, window_seconds: int) -> None:
    """Raise 429 when `key` exceeds `limit` calls within the window."""
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Too many attempts — try again shortly.")
    q.append(now)


def _naive_utc() -> datetime:
    """SQLite reads DateTime columns back as naive — compare like with like."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def sign_state(secret: str) -> str:
    """CSRF state for the Instagram OAuth round-trip: timestamp + HMAC."""
    timestamp = str(int(time.time()))
    signature = hmac.new(secret.encode(), timestamp.encode(), hashlib.sha256).hexdigest()
    return f"{timestamp}.{signature}"


def verify_state(secret: str, state: str, max_age_seconds: int = 600) -> bool:
    try:
        timestamp, signature = state.split(".")
    except ValueError:
        return False
    expected = hmac.new(secret.encode(), timestamp.encode(), hashlib.sha256).hexdigest()
    if not secrets.compare_digest(signature, expected):
        return False
    return time.time() - int(timestamp) <= max_age_seconds


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"pbkdf2${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 100_000)
    return secrets.compare_digest(digest.hex(), digest_hex)


def _hash_token(token: str) -> str:
    settings = get_settings()
    return hashlib.sha256((settings.session_secret + token).encode()).hexdigest()


async def create_session(session: AsyncSession, response: Response) -> None:
    settings = get_settings()
    token = secrets.token_urlsafe(32)
    max_age = settings.session_max_age_days * 86400
    session.add(
        AdminSession(
            token_hash=_hash_token(token),
            expires_at=_naive_utc() + timedelta(seconds=max_age),
        )
    )
    # Opportunistically prune expired sessions
    await session.execute(delete(AdminSession).where(AdminSession.expires_at < _naive_utc()))
    await session.commit()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        secure=not settings.debug,
        samesite="strict",
        path="/",
    )


async def destroy_session(session: AsyncSession, request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await session.execute(delete(AdminSession).where(AdminSession.token_hash == _hash_token(token)))
        await session.commit()
    response.delete_cookie(COOKIE_NAME, path="/")


async def require_admin(
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    # CSRF: state-changing requests must carry the custom header
    if request.method not in ("GET", "HEAD", "OPTIONS") and CSRF_HEADER not in request.headers:
        raise HTTPException(status_code=403, detail="Missing CSRF header")
    result = await session.execute(
        select(AdminSession).where(AdminSession.token_hash == _hash_token(token))
    )
    admin_session = result.scalar_one_or_none()
    if admin_session is None or admin_session.expires_at < _naive_utc():
        raise HTTPException(status_code=401, detail="Session expired")
