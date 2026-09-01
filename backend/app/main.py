from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models import AdminUser, Review, utcnow
from app.routers import (
    admin_auth,
    customers,
    galleries,
    health,
    instagram,
    invoices,
    public_gallery,
    reviews,
    slides,
)
from app.security import hash_password, verify_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Small single-tenant schema: create_all is idempotent and sufficient.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # The k8s secret bootstraps (and, when rotated, updates) the admin
    # credential; the hash is persisted in the DB.
    settings = get_settings()
    if settings.admin_password:
        async with SessionLocal() as session:
            admin = (
                await session.execute(select(AdminUser).where(AdminUser.username == "admin"))
            ).scalar_one_or_none()
            if admin is None:
                session.add(
                    AdminUser(username="admin", password_hash=hash_password(settings.admin_password))
                )
            elif not verify_password(settings.admin_password, admin.password_hash):
                admin.password_hash = hash_password(settings.admin_password)
                admin.updated_at = utcnow()
            await session.commit()
    # Seed the reference review so the home carousel has something to show
    async with SessionLocal() as session:
        if (await session.execute(select(Review))).scalar_one_or_none() is None:
            session.add(
                Review(
                    author="Catalina G",
                    quote=(
                        "Nathalie instantly created a safe and comfortable environment while "
                        "shooting. She hits the nail on the head every time and gives great "
                        "direction so the pictures come out beautiful."
                    ),
                    sort_order=0,
                )
            )
            await session.commit()
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Nathalie Lopez Photography API",
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        debug=settings.debug,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for router in (
        health,
        admin_auth,
        customers,
        invoices,
        galleries,
        public_gallery,
        reviews,
        slides,
        instagram,
    ):
        app.include_router(router.router, prefix="/api/v1")
    return app


app = create_app()
