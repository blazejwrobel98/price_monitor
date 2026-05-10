def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_products_crud(client):
    r = client.post(
        "/api/products",
        json={
            "name": "Test item",
            "url": "https://example.com",
            "price_selector": ".price",
            "currency": "PLN",
            "check_interval_minutes": 60,
            "is_active": True,
        },
    )
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    r = client.get("/api/products")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test item"
    assert data[0]["last_price"] is None

    r = client.patch(f"/api/products/{pid}", json={"name": "Renamed"})
    assert r.status_code == 200
    assert r.json()["name"] == "Renamed"

    r = client.delete(f"/api/products/{pid}")
    assert r.status_code == 204

    r = client.get("/api/products")
    assert r.json() == []
