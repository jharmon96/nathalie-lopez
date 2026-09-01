from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import AdminSession, AdminUser
from app.security import COOKIE_NAME, _hash_token, _naive_utc, create_session, destroy_session, throttle, verify_password

router = APIRouter(prefix="/admin")


class LoginBody(BaseModel):
    password: str


@router.post("/login")
async def login(
    body: LoginBody,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    settings = get_settings()
    throttle(
        "login:" + (request.client.host if request.client else "unknown"),
        settings.login_rate_max,
        settings.login_rate_window_seconds,
    )
    # The password hash persists in the DB (seeded from the k8s secret at startup)
    admin = (
        await db.execute(select(AdminUser).where(AdminUser.username == "admin"))
    ).scalar_one_or_none()
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Wrong password")
    await create_session(db, response)
    return {"ok": True}


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await destroy_session(db, request, response)
    return {"ok": True}


@router.get("/me")
async def me(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    admin_session = (
        await db.execute(select(AdminSession).where(AdminSession.token_hash == _hash_token(token)))
    ).scalar_one_or_none()
    if admin_session is None or admin_session.expires_at < _naive_utc():
        raise HTTPException(status_code=401, detail="Session expired")
    return {"ok": True}
