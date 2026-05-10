import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _test_env(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setenv("SCHEDULER_ENABLED", "false")
    db_path = tmp_path / "t.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))


@pytest.fixture()
def client():
    # Import after env is set by autouse fixture — reload app
    from importlib import reload

    import price_monitor.main as main_mod

    reload(main_mod)
    with TestClient(main_mod.app, raise_server_exceptions=False) as c:
        yield c
