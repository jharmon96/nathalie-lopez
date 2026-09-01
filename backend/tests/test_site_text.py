"""Site text: admin PUT round-trips and reaches public content."""


def test_put_then_get_site_text(admin_client):
    res = admin_client.put("/api/v1/admin/site", json={"values": {"invest_lede": "New wording"}})
    assert res.status_code == 200, res.text
    values = admin_client.get("/api/v1/admin/site").json()["values"]
    assert values["invest_lede"] == "New wording"


def test_site_text_reaches_public_content(admin_client, client):
    admin_client.put("/api/v1/admin/site", json={"values": {"invest_cta_title": "Ask me anything"}})
    site = client.get("/api/v1/public/content").json()["site"]
    assert site["invest_cta_title"] == "Ask me anything"


def test_put_upserts_existing_keys(admin_client):
    admin_client.put("/api/v1/admin/site", json={"values": {"invest_lede": "One"}})
    admin_client.put("/api/v1/admin/site", json={"values": {"invest_lede": "Two"}})
    values = admin_client.get("/api/v1/admin/site").json()["values"]
    assert values["invest_lede"] == "Two"


def test_put_clearing_value_stores_empty(admin_client):
    """An empty value must overwrite the old one so the page falls back to defaults."""
    admin_client.put("/api/v1/admin/site", json={"values": {"invest_lede": "Custom"}})
    admin_client.put("/api/v1/admin/site", json={"values": {"invest_lede": ""}})
    values = admin_client.get("/api/v1/admin/site").json()["values"]
    assert values["invest_lede"] == ""
