"""Harmonogram: przyrostowa synchronizacja jobów (bez resetu wszystkich produktów)."""

from datetime import timedelta

import pytest
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from price_monitor.config import Settings
from price_monitor.db import make_engine, make_session_factory
from price_monitor.migrate import run_database_migrations
from price_monitor.services.scheduler import schedule_product_jobs


@pytest.fixture()
def session_factory(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "d"))
    db_path = tmp_path / "sched.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    run_database_migrations(settings)
    engine = make_engine(settings)
    return make_session_factory(engine)


def test_reschedule_keeps_next_run_when_interval_unchanged(session_factory, monkeypatch):
    monkeypatch.setenv("SCHEDULER_ENABLED", "true")
    settings = Settings()
    sched = BackgroundScheduler(timezone="UTC")
    sched.start()
    try:
        with session_factory() as db:
            from price_monitor import crud

            a = crud.create_product(
                db,
                name="A",
                url="https://a.example",
                price_selector=".p",
                currency="PLN",
                check_interval_minutes=60,
                is_active=True,
            )
            b = crud.create_product(
                db,
                name="B",
                url="https://b.example",
                price_selector=".p",
                currency="PLN",
                check_interval_minutes=60,
                is_active=True,
            )
            aid, bid = a.id, b.id

        schedule_product_jobs(sched, session_factory, settings)
        job_a = sched.get_job(f"product_{aid}")
        assert job_a is not None
        next_a = job_a.next_run_time

        with session_factory() as db:
            from price_monitor import crud

            crud.update_product(db, crud.get_product(db, bid), name="B2")

        schedule_product_jobs(sched, session_factory, settings)

        job_a2 = sched.get_job(f"product_{aid}")
        assert job_a2 is not None
        assert job_a2.next_run_time == next_a
        trig = job_a2.trigger
        assert isinstance(trig, IntervalTrigger)
        assert trig.interval == timedelta(minutes=60)
    finally:
        sched.shutdown(wait=False)
