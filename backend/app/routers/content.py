from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import CarouselSlide, FaqEntry, PhotoEntry, Review, SessionEntry, SiteText
from app.security import require_admin

router = APIRouter()

VALID_CATEGORIES = ("portrait", "wedding", "editorial")


# ------------------------ public (one call feeds the whole site) ------------


@router.get("/public/content")
async def public_content(db: AsyncSession = Depends(get_db)) -> dict:
    faqs = (await db.execute(select(FaqEntry).order_by(FaqEntry.sort_order))).scalars().all()
    photos = (await db.execute(select(PhotoEntry).order_by(PhotoEntry.sort_order))).scalars().all()
    sessions = (await db.execute(select(SessionEntry).order_by(SessionEntry.sort_order))).scalars().all()
    site = {t.key: t.value for t in (await db.execute(select(SiteText))).scalars().all()}
    return {
        "faqs": [{"question": f.question, "answer": f.answer} for f in faqs],
        "photos": [
            {"category": p.category, "src": p.src, "alt": p.alt, "caption": p.caption, "exif": p.exif, "aspect": p.aspect or "4/5"}
            for p in photos
        ],
        "sessions": [
            {"name": s.name, "price": s.price, "blurb": s.blurb, "includes": (s.includes or "").split("\n"), "featured": s.featured}
            for s in sessions
        ],
        "site": site,
    }


# ------------------------ admin: FAQs ---------------------------------------


class FaqBody(BaseModel):
    question: str
    answer: str
    sort_order: int = 0


@router.get("/admin/faqs")
async def list_faqs(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(FaqEntry).order_by(FaqEntry.sort_order))).scalars().all()
    return {"faqs": [{"id": f.id, "question": f.question, "answer": f.answer, "sort_order": f.sort_order} for f in rows]}


@router.post("/admin/faqs")
async def create_faq(body: FaqBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    f = FaqEntry(**body.model_dump())
    db.add(f)
    await db.commit()
    return {"id": f.id, **body.model_dump()}


@router.patch("/admin/faqs/{faq_id}")
async def update_faq(faq_id: int, body: FaqBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    f = await db.get(FaqEntry, faq_id)
    if f is None:
        raise HTTPException(status_code=404, detail="FAQ not found")
    for key, value in body.model_dump().items():
        setattr(f, key, value)
    await db.commit()
    return {"id": f.id, **body.model_dump()}


@router.delete("/admin/faqs/{faq_id}")
async def delete_faq(faq_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    f = await db.get(FaqEntry, faq_id)
    if f is None:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await db.delete(f)
    await db.commit()
    return {"ok": True}


# ------------------------ admin: photos -------------------------------------


class PhotoBody(BaseModel):
    category: str
    src: str
    alt: str
    caption: str | None = None
    exif: str | None = None
    aspect: str | None = None
    sort_order: int = 0


@router.get("/admin/photos")
async def list_photos(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(PhotoEntry).order_by(PhotoEntry.sort_order))).scalars().all()
    return {
        "photos": [
            {"id": p.id, "category": p.category, "src": p.src, "alt": p.alt, "caption": p.caption, "exif": p.exif, "aspect": p.aspect, "sort_order": p.sort_order}
            for p in rows
        ]
    }


@router.post("/admin/photos")
async def create_photo(body: PhotoBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"Category must be one of {VALID_CATEGORIES}")
    p = PhotoEntry(**body.model_dump())
    db.add(p)
    await db.commit()
    return {"id": p.id, **body.model_dump()}


@router.patch("/admin/photos/{photo_id}")
async def update_photo(photo_id: int, body: PhotoBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    p = await db.get(PhotoEntry, photo_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    for key, value in body.model_dump().items():
        setattr(p, key, value)
    await db.commit()
    return {"id": p.id, **body.model_dump()}


@router.delete("/admin/photos/{photo_id}")
async def delete_photo(photo_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    p = await db.get(PhotoEntry, photo_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    await db.delete(p)
    await db.commit()
    return {"ok": True}


# ------------------------ admin: sessions -----------------------------------


class SessionBody(BaseModel):
    name: str
    price: str
    blurb: str | None = None
    includes: str | None = None
    featured: bool = False
    sort_order: int = 0


@router.get("/admin/sessions")
async def list_sessions(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(SessionEntry).order_by(SessionEntry.sort_order))).scalars().all()
    return {
        "sessions": [
            {"id": s.id, "name": s.name, "price": s.price, "blurb": s.blurb, "includes": s.includes, "featured": s.featured, "sort_order": s.sort_order}
            for s in rows
        ]
    }


@router.post("/admin/sessions")
async def create_session(body: SessionBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    s = SessionEntry(**body.model_dump())
    db.add(s)
    await db.commit()
    return {"id": s.id, **body.model_dump()}


@router.patch("/admin/sessions/{session_id}")
async def update_session(
    session_id: int, body: SessionBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    s = await db.get(SessionEntry, session_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Session not found")
    for key, value in body.model_dump().items():
        setattr(s, key, value)
    await db.commit()
    return {"id": s.id, **body.model_dump()}


# ------------------------ admin: site text ----------------------------------


class SiteTextBody(BaseModel):
    values: dict[str, str]


class ReorderBody(BaseModel):
    ids: list[int]


async def _apply_reorder(db: AsyncSession, model, ids: list[int]) -> None:
    for position, item_id in enumerate(ids):
        row = await db.get(model, item_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        row.sort_order = position
    await db.commit()


@router.post("/admin/photos/reorder")
async def reorder_photos(body: ReorderBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    await _apply_reorder(db, PhotoEntry, body.ids)
    return {"ok": True}


@router.post("/admin/sessions/reorder")
async def reorder_sessions(body: ReorderBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    await _apply_reorder(db, SessionEntry, body.ids)
    return {"ok": True}


@router.post("/admin/faqs/reorder")
async def reorder_faqs(body: ReorderBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    await _apply_reorder(db, FaqEntry, body.ids)
    return {"ok": True}


@router.post("/admin/reviews/reorder")
async def reorder_reviews(body: ReorderBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    await _apply_reorder(db, Review, body.ids)
    return {"ok": True}


@router.post("/admin/slides/reorder")
async def reorder_slides(body: ReorderBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    await _apply_reorder(db, CarouselSlide, body.ids)
    return {"ok": True}


@router.get("/admin/site")
async def get_site_text(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(SiteText))).scalars().all()
    return {"values": {r.key: r.value for r in rows}}


@router.put("/admin/site")
async def put_site_text(body: SiteTextBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    for key, value in body.values.items():
        row = await db.get(SiteText, key)
        if row is None:
            db.add(SiteText(key=key, value=value))
        else:
            row.value = value
    await db.commit()
    return {"ok": True}
