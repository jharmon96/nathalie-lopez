"""Portfolio photos: partial updates and external (S3-style) image URLs."""


def _create(client, src="https://nat-photos.s3.eu-west-2.amazonaws.com/bride.jpg", **kw):
    body = {"category": "wedding", "src": src, "alt": "Bride walking", **kw}
    res = client.post("/api/v1/admin/photos", json=body)
    assert res.status_code == 200, res.text
    return res.json()["id"]


def test_patch_single_field_keeps_rest(admin_client):
    pid = _create(admin_client, caption="original caption")
    res = admin_client.patch(f"/api/v1/admin/photos/{pid}", json={"alt": "New alt text"})
    assert res.status_code == 200, res.text
    photo = res.json()
    assert photo["alt"] == "New alt text"
    # Untouched fields survive a partial update.
    assert photo["src"] == "https://nat-photos.s3.eu-west-2.amazonaws.com/bride.jpg"
    assert photo["caption"] == "original caption"
    assert photo["category"] == "wedding"


def test_patch_can_change_url_category_and_caption(admin_client):
    pid = _create(admin_client)
    res = admin_client.patch(
        f"/api/v1/admin/photos/{pid}",
        json={"src": "/photos/local-copy.jpg", "category": "portrait", "caption": "Studio portrait"},
    )
    assert res.status_code == 200, res.text
    photo = res.json()
    assert photo["src"] == "/photos/local-copy.jpg"
    assert photo["category"] == "portrait"
    assert photo["caption"] == "Studio portrait"


def test_patch_rejects_invalid_category(admin_client):
    pid = _create(admin_client)
    res = admin_client.patch(f"/api/v1/admin/photos/{pid}", json={"category": "landscape"})
    assert res.status_code == 422


def test_patch_rejects_empty_url(admin_client):
    pid = _create(admin_client)
    res = admin_client.patch(f"/api/v1/admin/photos/{pid}", json={"src": "   "})
    assert res.status_code == 422


def test_external_url_round_trips_to_public_content(admin_client, client):
    """An S3-style URL must reach the public site content unchanged."""
    pid = _create(admin_client, src="https://bucket.s3.amazonaws.com/x.jpg", alt="A")
    admin_client.patch(f"/api/v1/admin/photos/{pid}", json={"alt": "From the bucket"})
    public = client.get("/api/v1/public/content").json()["photos"]
    match = [p for p in public if p["src"] == "https://bucket.s3.amazonaws.com/x.jpg"]
    assert len(match) == 1
    assert match[0]["alt"] == "From the bucket"
    assert match[0]["category"] == "wedding"
