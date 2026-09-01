"""Shared fixtures: in-memory database, API client, authenticated admin client.

The app is imported after the test environment variables are set so that
settings are captured correctly.
"""

import os

# Must be set before app.config is imported (lru_cached settings)
os.environ.setdefault("NLP_ADMIN_PASSWORD", "test-admin-pw")
os.environ.setdefault("NLP_SESSION_SECRET", "test-session-secret")
os.environ.setdefault("NLP_DATABASE_URL", "sqlite+aiosqlite://")
os.environ.setdefault("NLP_INSTAGRAM_APP_ID", "1234567890")
os.environ.setdefault("NLP_INSTAGRAM_APP_SECRET", "test-app-secret")
# Secure cookies are not sent over the test client's http connection
os.environ.setdefault("NLP_DEBUG", "true")
os.environ.setdefault("NLP_LOGIN_RATE_MAX", "1000")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.security import hash_password
from app.main import app
from app.models import AdminUser

TEST_ADMIN_PASSWORD = "test-admin-pw"


def _make_engine():
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.pool import StaticPool

    # StaticPool keeps one shared connection so the in-memory database is
    # visible to every session in the test.
    return create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )


@pytest.fixture
def db_engine():
    """Fresh in-memory database with all tables created and content seeded."""
    import asyncio

    from app.db import Base
    from app.seed import seed_content

    engine = _make_engine()

    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with factory() as session:
            session.add(
                AdminUser(username="admin", password_hash=hash_password(TEST_ADMIN_PASSWORD))
            )
            await seed_content(session)

    asyncio.get_event_loop_policy().new_event_loop().run_until_complete(setup())
    yield engine
    asyncio.get_event_loop_policy().new_event_loop().run_until_complete(engine.dispose())


@pytest.fixture
def db_factory(db_engine):
    from sqlalchemy.ext.asyncio import async_sessionmaker

    return async_sessionmaker(db_engine, expire_on_commit=False)


@pytest.fixture
def client(db_engine, db_factory):
    """API client wired to the in-memory database (lifespan not run)."""
    from app.db import get_db

    async def override_get_db():
        async with db_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client):
    """A client authenticated as the admin."""
    res = client.post("/api/v1/admin/login", json={"password": TEST_ADMIN_PASSWORD})
    assert res.status_code == 200, res.text
    client.headers["X-NLP-Admin"] = "1"
    return client
