"""Hero carousel slides: partial updates and public visibility."""

import pytest

from app.models import CarouselSlide


@pytest.fixture
def seeded_slides(db_engine):
    """Add two known slides on top of the standard seed."""
    import asyncio

    from sqlalchemy.ext.asyncio import async_sessionmaker

    factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def add():
        async with factory() as session:
            session.add_all(
                [
                    CarouselSlide(image_url="/photos/one.jpg", alt="First", caption="One", sort_order=0),
                    CarouselSlide(image_url="/photos/two.jpg", alt="Second", caption=None, sort_order=1),
                ]
            )
            await session.commit()

    asyncio.get_event_loop_policy().new_event_loop().run_until_complete(add())
    return db_engine


def test_create_and_public_visibility(admin_client, client):
    res = admin_client.post(
        "/api/v1/admin/slides",
        json={"image_url": "/photos/new.jpg", "alt": "New slide", "caption": None},
    )
    assert res.status_code == 200, res.text
    public = client.get("/api/v1/public/slides").json()["slides"]
    assert any(s["image_url"] == "/photos/new.jpg" for s in public)


def test_patch_single_field_keeps_rest(admin_client, seeded_slides):
    res = admin_client.patch("/api/v1/admin/slides/1", json={"alt": "Updated alt"})
    assert res.status_code == 200, res.text
    slide = res.json()
    assert slide["alt"] == "Updated alt"
    assert slide["image_url"] == "/photos/one.jpg"
    assert slide["caption"] == "One"


def test_patch_caption_to_null(admin_client, seeded_slides):
    res = admin_client.patch("/api/v1/admin/slides/1", json={"caption": None})
    assert res.status_code == 200
    assert res.json()["caption"] is None


def test_patch_rejects_empty_url(admin_client, seeded_slides):
    res = admin_client.patch("/api/v1/admin/slides/1", json={"image_url": "  "})
    assert res.status_code == 422


def test_delete_missing_slide_404(admin_client):
    assert admin_client.delete("/api/v1/admin/slides/999").status_code == 404
