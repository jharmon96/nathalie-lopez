from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import Gallery
from app.security import throttle

router = APIRouter(prefix="/public/galleries")


class UnlockBody(BaseModel):
    passphrase: str


async def _load(db: AsyncSession, slug: str) -> Gallery:
    g = (await db.execute(select(Gallery).where(Gallery.slug == slug))).scalar_one_or_none()
    if g is None:
        raise HTTPException(status_code=404, detail="Gallery not found")
    await db.refresh(g, attribute_names=["photos"])
    return g


def _open_view(g: Gallery) -> dict:
    return {
        "title": g.title,
        "description": g.description,
        "requires_password": bool(g.passphrase),
        "photos": [
            {"url": p.url, "caption": p.caption}
            for p in sorted(g.photos, key=lambda p: p.sort_order)
        ],
    }


def _locked_view(g: Gallery) -> dict:
    return {
        "title": g.title,
        "description": g.description,
        "requires_password": True,
        "photos": None,
    }


@router.get("/{slug}")
async def view_gallery(slug: str, db: AsyncSession = Depends(get_db)) -> dict:
    g = await _load(db, slug)
    return _locked_view(g) if g.passphrase else _open_view(g)


@router.post("/{slug}/unlock")
async def unlock_gallery(slug: str, body: UnlockBody, db: AsyncSession = Depends(get_db)) -> dict:
    settings = get_settings()
    throttle(
        "gallery:" + slug,
        settings.login_rate_max * 4,
        settings.login_rate_window_seconds,
    )
    g = await _load(db, slug)
    if not g.passphrase:
        return _open_view(g)
    if body.passphrase != g.passphrase:
        raise HTTPException(status_code=403, detail="Wrong passphrase")
    return _open_view(g)
