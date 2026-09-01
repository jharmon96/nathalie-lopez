"""One-time seeding of editable content, mirroring the defaults in the
frontend's src/config/content.ts. Runs at startup; only fills empty tables so
Nathalie's admin edits are never overwritten."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FaqEntry, PhotoEntry, SessionEntry, SiteText

logger = logging.getLogger("seed")

SEED_FAQS = [
    {"question": "How do we book you?", "answer": "Start with the enquiry form. We begin with a call or a coffee, and once we agree on the plan a 25% retainer locks in the date.", "sort_order": 0},
    {"question": "Do you travel?", "answer": "Happily. Based in West Yorkshire, I photograph weddings and commissions across the UK and further afield — destination weddings carry simple, flat-rate travel pricing.", "sort_order": 1},
    {"question": "How many photographs will we get?", "answer": "A portrait sitting yields 20+ finished frames; a full wedding day, 600+. Every gallery is a tight edit — culled, printed, and proofed by hand — not everything shot.", "sort_order": 2},
    {"question": "Do you shoot film?", "answer": "Yes — 35mm and 120 alongside digital where it earns its place. Film scans arrive in the same gallery, labelled by stock.", "sort_order": 3},
    {"question": "How long until we see the gallery?", "answer": "Portrait galleries within two weeks. Weddings within eight weeks, with a handful of sneak peeks in the days after.", "sort_order": 4},
    {"question": "Can we order prints and albums?", "answer": "Absolutely. Archival pigment prints, silver-gelatin darkroom prints, and heirloom albums are all available through the studio.", "sort_order": 5},
]

SEED_PHOTOS = [
    {"category": "portrait", "src": "/photos/nat-lopez-portrait-photo-sample.jpg", "alt": "Golden-hour portrait on the dunes, white lace against low sun", "caption": "Golden hour, on the dunes", "exif": "f/1.8 · 1/500 · ISO 100 · 50mm", "aspect": "4/5", "sort_order": 0},
    {"category": "wedding", "src": "/photos/nat-lopez-couple-photo-sample.jpg", "alt": "A couple kissing beside a vintage car on the lakeshore at sunset", "caption": "The lake house, first look", "exif": "f/2 · 1/1000 · ISO 200 · 35mm", "aspect": "4/5", "sort_order": 1},
    {"category": "wedding", "src": "/photos/nat-lopez-wedding-photo-sample.jpg", "alt": "A newly married couple walking a coastal path through tall grass", "caption": "After the ceremony, on the coast", "exif": "f/4 · 1/500 · ISO 100 · 85mm", "aspect": "3/2", "sort_order": 2},
    {"category": "editorial", "src": "", "alt": "Ceramicist’s hands centred over the wheel, clay mid-turn", "caption": "For Craft Quarterly", "exif": "f/2.8 · 1/250 · ISO 400 · 85mm", "aspect": "4/5", "sort_order": 3},
    {"category": "wedding", "src": "", "alt": "Bride lacing her own shoes, dress pooled on the floor", "caption": "Getting ready, 7:40 am", "exif": "f/2.2 · 1/200 · ISO 800 · 50mm", "aspect": "4/5", "sort_order": 4},
    {"category": "editorial", "src": "", "alt": "Chef framed by the kitchen pass, steam crossing the light", "caption": "Service, for Palate", "exif": "f/2 · 1/160 · ISO 3200 · 35mm", "aspect": "3/2", "sort_order": 5},
]

SEED_SESSIONS = [
    {
        "name": "Portrait sitting",
        "price": "from £300",
        "blurb": "One hour, one or two locations, film and digital. For people, couples, and small families.",
        "includes": "60–90 minutes\n20+ finished frames\nPrivate online gallery\nPrint-ready files",
        "featured": False,
        "sort_order": 0,
    },
    {
        "name": "Weddings",
        "price": "from £2,400",
        "blurb": "Full-day coverage with a second shooter. Documented the way the day actually felt.",
        "includes": "8–10 hours coverage\nSecond photographer\n600+ finished frames\nHeirloom album option",
        "featured": True,
        "sort_order": 1,
    },
    {
        "name": "Editorial & commercial",
        "price": "day rate",
        "blurb": "Assignments and commissions for magazines, makers, and brands. Licencing handled simply.",
        "includes": "Half or full day\nUsage licencing\nRetouching included\nFast turnaround",
        "featured": False,
        "sort_order": 2,
    },
]

SEED_SITE_TEXT = {
    "tagline": "Wedding & portrait photography capturing life's most unforgettable moments",
    "service_area": "Serving the UK & Destinations Worldwide",
}


async def seed_content(db) -> None:
    """Fill any empty content table with the studio defaults."""
    seeded: list[str] = []

    if (await db.execute(select(FaqEntry).limit(1))).scalar_one_or_none() is None:
        for row in SEED_FAQS:
            db.add(FaqEntry(**row))
        seeded.append("faqs")

    if (await db.execute(select(PhotoEntry).limit(1))).scalar_one_or_none() is None:
        for row in SEED_PHOTOS:
            db.add(PhotoEntry(**row))
        seeded.append("photos")

    if (await db.execute(select(SessionEntry).limit(1))).scalar_one_or_none() is None:
        for row in SEED_SESSIONS:
            db.add(SessionEntry(**row))
        seeded.append("sessions")

    if (await db.execute(select(SiteText).limit(1))).scalar_one_or_none() is None:
        for key, value in SEED_SITE_TEXT.items():
            db.add(SiteText(key=key, value=value))
        seeded.append("site text")

    if seeded:
        await db.commit()
        logger.info("Seeded empty content tables: %s", ", ".join(seeded))
