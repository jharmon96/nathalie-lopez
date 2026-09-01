from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Gallery, GalleryPhoto
from app.security import require_admin

router = APIRouter(prefix="/admin/galleries")


class PhotoBody(BaseModel):
    url: str
    caption: str | None = None
    sort_order: int = 0


class GalleryBody(BaseModel):
    customer_id: int | None = None
    title: str
    slug: str
    passphrase: str | None = None
    description: str | None = None


class PhotoOut(BaseModel):
    id: int
    url: str
    caption: str | None
    sort_order: int


class GalleryOut(GalleryBody):
    id: int
    photos: list[PhotoOut]


def _out(g: Gallery) -> dict:
    return GalleryOut(
        id=g.id,
        customer_id=g.customer_id,
        title=g.title,
        slug=g.slug,
        passphrase=g.passphrase,
        description=g.description,
        photos=[
            PhotoOut(id=p.id, url=p.url, caption=p.caption, sort_order=p.sort_order) for p in g.photos
        ],
    ).model_dump()


async def _gallery_or_404(db: AsyncSession, gallery_id: int) -> Gallery:
    g = await db.get(Gallery, gallery_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Gallery not found")
    # Eager-load photos (lazy loading doesn't work in async sessions)
    await db.refresh(g, attribute_names=["photos"])
    return g


@router.get("")
async def list_galleries(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(Gallery).order_by(Gallery.created_at.desc()))).scalars().all()
    out = []
    for g in rows:
        await db.refresh(g, attribute_names=["photos"])
        out.append(_out(g))
    return {"galleries": out}


@router.post("")
async def create_gallery(
    body: GalleryBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    g = Gallery(**body.model_dump())
    db.add(g)
    await db.commit()
    return _out(await _gallery_or_404(db, g.id))


@router.patch("/{gallery_id}")
async def update_gallery(
    gallery_id: int, body: GalleryBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    g = await _gallery_or_404(db, gallery_id)
    g.customer_id = body.customer_id
    g.title = body.title
    g.slug = body.slug
    g.passphrase = body.passphrase
    g.description = body.description
    await db.commit()
    return _out(g)


@router.delete("/{gallery_id}")
async def delete_gallery(
    gallery_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    g = await _gallery_or_404(db, gallery_id)
    await db.delete(g)
    await db.commit()
    return {"ok": True}


@router.post("/{gallery_id}/photos")
async def add_photo(
    gallery_id: int, body: PhotoBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    g = await _gallery_or_404(db, gallery_id)
    g.photos.append(GalleryPhoto(gallery_id=g.id, **body.model_dump()))
    await db.commit()
    return _out(await _gallery_or_404(db, gallery_id))


@router.delete("/{gallery_id}/photos/{photo_id}")
async def delete_photo(
    gallery_id: int, photo_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    g = await _gallery_or_404(db, gallery_id)
    g.photos = [p for p in g.photos if p.id != photo_id]
    await db.commit()
    return _out(g)
