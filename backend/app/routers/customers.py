from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Customer
from app.security import require_admin

router = APIRouter(prefix="/admin/customers")


class CustomerBody(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    notes: str | None = None


class CustomerOut(CustomerBody):
    id: int
    created_at: datetime

    @classmethod
    def from_model(cls, c: Customer) -> "CustomerOut":
        return cls(
            id=c.id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            source=c.source,
            notes=c.notes,
            created_at=c.created_at,
        )


def _apply(c: Customer, body: CustomerBody) -> None:
    c.name = body.name
    c.email = body.email
    c.phone = body.phone
    c.source = body.source
    c.notes = body.notes


@router.get("")
async def list_customers(db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)) -> dict:
    rows = (await db.execute(select(Customer).order_by(Customer.created_at.desc()))).scalars().all()
    return {"customers": [CustomerOut.from_model(c).model_dump() for c in rows]}


@router.post("")
async def create_customer(
    body: CustomerBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    c = Customer()
    _apply(c, body)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return CustomerOut.from_model(c).model_dump()


@router.patch("/{customer_id}")
async def update_customer(
    customer_id: int, body: CustomerBody, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    c = await db.get(Customer, customer_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    _apply(c, body)
    await db.commit()
    return CustomerOut.from_model(c).model_dump()


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int, db: AsyncSession = Depends(get_db), _: None = Depends(require_admin)
) -> dict:
    c = await db.get(Customer, customer_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(c)
    await db.commit()
    return {"ok": True}
