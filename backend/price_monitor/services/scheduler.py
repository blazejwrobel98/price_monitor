from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session, sessionmaker

from price_monitor import crud
from price_monitor.config import Settings
from price_monitor.services.checker import run_check_for_product

if TYPE_CHECKING:
    pass

log = logging.getLogger(__name__)


def schedule_product_jobs(
    scheduler: BackgroundScheduler,
    session_factory: sessionmaker,
    settings: Settings,
) -> None:
    """Rejestruje joby interwałowe dla aktywnych produktów.

    Nie wywołuje ``remove_all_jobs()`` — przy zapisie jednego produktu pozostałe
    zachowują zaplanowany ``next_run_time``. Wcześniej każda zmiana w API kasowała
    wszystkie joby i odraczała sprawdzenia o pełny interwał od zera.
    """
    with session_factory() as db:
        products = crud.list_products(db, active_only=True)

    desired_ids = {f"product_{p.id}" for p in products}
    for job in list(scheduler.get_jobs()):
        jid = job.id
        if jid and str(jid).startswith("product_") and jid not in desired_ids:
            try:
                scheduler.remove_job(jid)
            except Exception:
                log.exception("remove_job failed id=%s", jid)

    now = datetime.now(timezone.utc)

    for p in products:
        minutes = max(5, int(p.check_interval_minutes or 60))
        job_id = f"product_{p.id}"
        interval_td = timedelta(minutes=minutes)

        def make_runner(product_id: int):
            def run():
                with session_factory() as db:  # type: Session
                    prod = crud.get_product(db, product_id)
                    if prod and prod.is_active:
                        try:
                            run_check_for_product(db, prod, settings)
                            log.info("check_ok product_id=%s", product_id)
                        except Exception:
                            log.exception("check_failed product_id=%s", product_id)

            return run

        runner = make_runner(p.id)
        existing = scheduler.get_job(job_id)
        if existing is not None:
            trig = existing.trigger
            if isinstance(trig, IntervalTrigger) and trig.interval == interval_td:
                continue
            try:
                scheduler.remove_job(job_id)
            except Exception:
                log.exception("remove_job before reschedule id=%s", job_id)

        stagger_sec = (p.id * 17) % 120
        misfire_sec = min(3600, max(120, int(minutes * 60)))
        scheduler.add_job(
            runner,
            "interval",
            minutes=minutes,
            id=job_id,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=misfire_sec,
            next_run_time=now + timedelta(seconds=stagger_sec),
        )
    log.info("scheduler jobs registered count=%s", len(products))
