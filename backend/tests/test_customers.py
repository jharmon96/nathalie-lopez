"""CRM: customer CRUD through the admin API."""


def test_create_and_list_customers(admin_client):
    res = admin_client.post(
        "/api/v1/admin/customers",
        json={"name": "Marta Reyes", "email": "marta@example.com", "source": "instagram"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == 1

    listed = admin_client.get("/api/v1/admin/customers").json()["customers"]
    assert len(listed) == 1
    assert listed[0]["name"] == "Marta Reyes"


def test_update_customer(admin_client):
    admin_client.post("/api/v1/admin/customers", json={"name": "Before"})
    res = admin_client.patch("/api/v1/admin/customers/1", json={"name": "After"})
    assert res.status_code == 200
    assert res.json()["name"] == "After"


def test_delete_customer(admin_client):
    admin_client.post("/api/v1/admin/customers", json={"name": "Gone soon"})
    res = admin_client.delete("/api/v1/admin/customers/1")
    assert res.status_code == 200
    assert len(admin_client.get("/api/v1/admin/customers").json()["customers"]) == 0


def test_delete_missing_customer_404(admin_client):
    assert admin_client.delete("/api/v1/admin/customers/999").status_code == 404
