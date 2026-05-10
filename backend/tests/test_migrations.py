"""Database migration behaviour."""

from pathlib import Path

import pytest
from sqlalchemy import inspect

from price_monitor.config import Settings
from price_monitor.db import make_engine
from price_monitor.migrate import run_database_migrations
from price_monitor.models import Base


def test_migrate_creates_schema(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    db = tmp_path / "fresh.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    monkeypatch.setenv("SCHEDULER_ENABLED", "false")

    settings = Settings()
    run_database_migrations(settings)

    engine = make_engine(settings)
    try:
        names = inspect(engine).get_table_names()
    finally:
        engine.dispose()

    assert "products" in names
    assert "price_records" in names
    assert "alembic_version" in names


def test_legacy_create_all_database_gets_stamped(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    db = tmp_path / "legacy.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    monkeypatch.setenv("SCHEDULER_ENABLED", "false")

    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    engine = make_engine(settings)
    Base.metadata.create_all(bind=engine)
    engine.dispose()

    e = make_engine(settings)
    try:
        assert "alembic_version" not in inspect(e).get_table_names()
    finally:
        e.dispose()

    run_database_migrations(settings)

    engine = make_engine(settings)
    try:
        insp = inspect(engine)
        names = insp.get_table_names()
    finally:
        engine.dispose()

    assert "alembic_version" in names
