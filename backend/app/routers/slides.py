from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import CarouselSlide
from app.security import require_admin

router = APIRouter()


class SlideBody(BaseModel):
    image_url: str
    alt: str
    caption: str | None = None
    sort_order: int = 0


@router.get("/public/slides")
async def public_slides(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (await db.execute(select(CarouselSlide).order_by(CarouselSlide.sort_order))).scalars().all()
    return {"slides": [{"image_url": s.image_url, "alt": s.alt, "caption": s.caption} for s in rows]}


@router.get("/admin/slides")
async def list_slides(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(CarouselSlide).order_by(CarouselSlide.sort_order))).scalars().all()
    return {
        "slides": [
            {"id": s.id, "image_url": s.image_url, "alt": s.alt, "caption": s.caption, "sort_order": s.sort_order}
            for s in rows
        ]
    }


@router.post("/admin/slides")
async def create_slide(
    body: SlideBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    s = CarouselSlide(**body.model_dump())
    db.add(s)
    await db.commit()
    return {"id": s.id, **body.model_dump()}


@router.patch("/admin/slides/{slide_id}")
async def update_slide(
    slide_id: int, body: SlideBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    s = await db.get(CarouselSlide, slide_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Slide not found")
    for key, value in body.model_dump().items():
        setattr(s, key, value)
    await db.commit()
    return {"id": s.id, **body.model_dump()}


@router.delete("/admin/slides/{slide_id}")
async def delete_slide(
    slide_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    s = await db.get(CarouselSlide, slide_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Slide not found")
    await db.delete(s)
    await db.commit()
    return {"ok": True}
