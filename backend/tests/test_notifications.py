from unittest.mock import MagicMock, patch

from price_monitor.services.ntfy import _latin1_header_value, resolve_ntfy_publish_url


def test_latin1_header_replaces_em_dash():
    assert _latin1_header_value("Price Monitor \u2014 test") == "Price Monitor - test"


def test_resolve_ntfy_topic():
    u = resolve_ntfy_publish_url("moj-kanal-testowy")
    assert u == "https://ntfy.sh/moj-kanal-testowy"


def test_resolve_ntfy_full_url():
    u = resolve_ntfy_publish_url("https://ntfy.example.com/foo/bar")
    assert u == "https://ntfy.example.com/foo/bar"


def test_notifications_get_put(client):
    r = client.get("/api/settings/notifications")
    assert r.status_code == 200
    assert r.json() == {"ntfy_channel": ""}

    r = client.put("/api/settings/notifications", json={"ntfy_channel": "  x  "})
    assert r.status_code == 200
    assert r.json() == {"ntfy_channel": "x"}

    r = client.get("/api/settings/notifications")
    assert r.json() == {"ntfy_channel": "x"}

    r = client.put("/api/settings/notifications", json={"ntfy_channel": ""})
    assert r.status_code == 200
    assert r.json() == {"ntfy_channel": ""}


def test_notifications_test_requires_channel(client):
    r = client.post("/api/settings/notifications/test")
    assert r.status_code == 400


def test_notifications_test_ok(client):
    client.put("/api/settings/notifications", json={"ntfy_channel": "topic-x"})

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.raise_for_status = MagicMock()

    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.post = MagicMock(return_value=mock_resp)

    with patch("price_monitor.api.notifications.httpx.Client", return_value=mock_client):
        r = client.post("/api/settings/notifications/test")
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    mock_client.post.assert_called_once()
    args, kwargs = mock_client.post.call_args
    assert args[0] == "https://ntfy.sh/topic-x"
