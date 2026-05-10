"""Apply database migrations on startup (Alembic)."""

from __future__ import annotations

import logging
from pathlib import Path

import price_monitor
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from price_monitor.config import Settings
from price_monitor.db import make_engine

log = logging.getLogger(__name__)

INITIAL_REVISION = "0001_initial"


def alembic_config_path() -> Path:
    """Resolve alembic.ini next to the installed package (wheel) or backend/ (editable)."""
    root = Path(price_monitor.__file__).resolve().parent.parent
    ini = root / "alembic.ini"
    if not ini.is_file():
        msg = (
            f"Missing {ini}. If you run from a checkout, ensure backend/alembic.ini exists; "
            "if you use a wheel, reinstall so Alembic files are bundled."
        )
        raise FileNotFoundError(msg)
    return ini


def run_database_migrations(settings: Settings) -> None:
    """Upgrade schema to head. Legacy DBs created with create_all are stamped then upgraded."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    cfg = Config(str(alembic_config_path()))

    engine = make_engine(settings)
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
    finally:
        engine.dispose()

    if "products" in tables and "alembic_version" not in tables:
        log.info(
            "Legacy database detected (tables without alembic_version); stamping revision %s.",
            INITIAL_REVISION,
        )
        command.stamp(cfg, INITIAL_REVISION)

    command.upgrade(cfg, "head")
