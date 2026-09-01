"""Invoice validation and status flow."""


def test_create_invoice_rejects_bad_status(admin_client):
    res = admin_client.post(
        "/api/v1/admin/invoices",
        json={"number": "NL-001", "amount_cents": 1000, "status": "bogus"},
    )
    assert res.status_code == 422


def test_create_invoice_rejects_negative_amount(admin_client):
    res = admin_client.post(
        "/api/v1/admin/invoices",
        json={"number": "NL-001", "amount_cents": -5, "status": "draft"},
    )
    assert res.status_code == 422


def test_invoice_lifecycle(admin_client):
    for i, status in enumerate(["draft", "sent", "paid"]):
        res = admin_client.post(
            "/api/v1/admin/invoices",
            json={"number": f"NL-{i:03d}", "amount_cents": 10000 + i, "status": status},
        )
        assert res.status_code == 200, res.text

    invoices = admin_client.get("/api/v1/admin/invoices").json()["invoices"]
    assert len(invoices) == 3

    draft = next(i for i in invoices if i["status"] == "draft")
    res = admin_client.patch(
        f"/api/v1/admin/invoices/{draft['id']}",
        json={"number": draft["number"], "amount_cents": draft["amount_cents"], "status": "paid"},
    )
    assert res.status_code == 200


def test_duplicate_invoice_number_rejected(admin_client):
    body = {"number": "NL-DUP", "amount_cents": 1000, "status": "draft"}
    assert admin_client.post("/api/v1/admin/invoices", json=body).status_code == 200
    res = admin_client.post("/api/v1/admin/invoices", json={**body, "amount_cents": 2000})
    assert res.status_code == 409
