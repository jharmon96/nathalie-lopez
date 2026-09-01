"""Authentication and session behaviour."""


def test_login_wrong_password(client):
    res = client.post("/api/v1/admin/login", json={"password": "nope"})
    assert res.status_code == 401


def test_login_success_sets_cookie(client):
    res = client.post("/api/v1/admin/login", json={"password": "test-admin-pw"})
    assert res.status_code == 200
    assert "nlp_session" in res.cookies


def test_me_requires_session(client):
    assert client.get("/api/v1/admin/me").status_code == 401


def test_me_with_session(admin_client):
    assert admin_client.get("/api/v1/admin/me").status_code == 200


def test_me_after_logout(admin_client):
    admin_client.post("/api/v1/admin/logout")
    assert admin_client.get("/api/v1/admin/me").status_code == 401


def test_admin_endpoints_require_session(client):
    assert client.get("/api/v1/admin/customers").status_code == 401
    assert client.get("/api/v1/admin/invoices").status_code == 401
    assert client.get("/api/v1/admin/faqs").status_code == 401


def test_writes_require_csrf_header(admin_client):
    # Signed in, but the write lacks the X-NLP-Admin header → 403
    admin_client.headers.pop("X-NLP-Admin", None)
    res = admin_client.post("/api/v1/admin/customers", json={"name": "No CSRF"})
    assert res.status_code == 403
