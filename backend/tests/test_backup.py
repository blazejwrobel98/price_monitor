def test_download_backup_after_migrations(client):
    r = client.get("/api/settings/backup")
    assert r.status_code == 200
    assert r.content.startswith(b"SQLite format 3")


def test_restore_rejects_non_sqlite(client):
    r = client.post(
        "/api/settings/backup",
        files={"file": ("x.txt", b"not a database", "application/octet-stream")},
    )
    assert r.status_code == 400


def test_restore_roundtrip(client):
    r0 = client.get("/api/settings/backup")
    assert r0.status_code == 200
    blob = r0.content

    r = client.post("/api/products", json={
        "name": "X",
        "url": "https://example.com",
        "price_selector": ".p",
        "currency": "PLN",
        "check_interval_minutes": 60,
        "is_active": True,
    })
    assert r.status_code == 201

    r2 = client.post("/api/settings/backup", files={"file": ("restore.db", blob, "application/octet-stream")})
    assert r2.status_code == 200, r2.text

    r3 = client.get("/api/products")
    assert r3.status_code == 200
    assert r3.json() == []
