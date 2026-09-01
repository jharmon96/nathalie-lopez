from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Invoice
from app.security import require_admin

router = APIRouter(prefix="/admin/invoices")

VALID_STATUSES = ("draft", "sent", "paid", "void")


class InvoiceBody(BaseModel):
    customer_id: int | None = None
    number: str
    amount_cents: int
    status: str = "draft"
    issued_at: str | None = None
    due_at: str | None = None
    notes: str | None = None


class InvoiceOut(InvoiceBody):
    id: int
    created_at: datetime

    @classmethod
    def from_model(cls, i: Invoice) -> "InvoiceOut":
        return cls(
            id=i.id,
            customer_id=i.customer_id,
            number=i.number,
            amount_cents=i.amount_cents,
            status=i.status,
            issued_at=i.issued_at,
            due_at=i.due_at,
            notes=i.notes,
            created_at=i.created_at,
        )


@router.get("")
async def list_invoices(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(Invoice).order_by(Invoice.created_at.desc()))).scalars().all()
    return {"invoices": [InvoiceOut.from_model(i).model_dump() for i in rows]}


@router.post("")
async def create_invoice(
    body: InvoiceBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Status must be one of {VALID_STATUSES}")
    if body.amount_cents < 0:
        raise HTTPException(status_code=422, detail="Amount must not be negative")
    i = Invoice(
        customer_id=body.customer_id,
        number=body.number,
        amount_cents=body.amount_cents,
        status=body.status,
        issued_at=body.issued_at,
        due_at=body.due_at,
        notes=body.notes,
    )
    db.add(i)
    await db.commit()
    await db.refresh(i)
    return InvoiceOut.from_model(i).model_dump()


@router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: int, body: InvoiceBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    i = await db.get(Invoice, invoice_id)
    if i is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Status must be one of {VALID_STATUSES}")
    i.customer_id = body.customer_id
    i.number = body.number
    i.amount_cents = body.amount_cents
    i.status = body.status
    i.issued_at = body.issued_at
    i.due_at = body.due_at
    i.notes = body.notes
    await db.commit()
    return InvoiceOut.from_model(i).model_dump()


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    i = await db.get(Invoice, invoice_id)
    if i is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.delete(i)
    await db.commit()
    return {"ok": True}
