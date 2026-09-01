from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Review
from app.security import require_admin

router = APIRouter()


class ReviewBody(BaseModel):
    author: str
    quote: str
    source: str | None = None
    sort_order: int = 0


@router.get("/public/reviews")
async def public_reviews(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (await db.execute(select(Review).order_by(Review.sort_order))).scalars().all()
    return {"reviews": [{"author": r.author, "quote": r.quote, "source": r.source} for r in rows]}


@router.get("/admin/reviews")
async def list_reviews(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(Review).order_by(Review.sort_order))).scalars().all()
    return {
        "reviews": [
            {"id": r.id, "author": r.author, "quote": r.quote, "source": r.source, "sort_order": r.sort_order}
            for r in rows
        ]
    }


@router.post("/admin/reviews")
async def create_review(
    body: ReviewBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    r = Review(**body.model_dump())
    db.add(r)
    await db.commit()
    return {"id": r.id, **body.model_dump()}


@router.patch("/admin/reviews/{review_id}")
async def update_review(
    review_id: int, body: ReviewBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    r = await db.get(Review, review_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Review not found")
    for key, value in body.model_dump().items():
        setattr(r, key, value)
    await db.commit()
    return {"id": r.id, **body.model_dump()}


@router.patch("/admin/reviews/{review_id}")
async def update_review(review_id: int, body: ReviewBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    r = await db.get(Review, review_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Review not found")
    for key, value in body.model_dump().items():
        setattr(r, key, value)
    await db.commit()
    return {"id": r.id, **body.model_dump()}


@router.delete("/admin/reviews/{review_id}")
async def delete_review(
    review_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    r = await db.get(Review, review_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(r)
    await db.commit()
    return {"ok": True, "deleted_at": datetime.now().isoformat()}
