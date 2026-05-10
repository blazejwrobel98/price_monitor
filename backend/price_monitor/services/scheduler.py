from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from apscheduler.schedulers.background import BackgroundScheduler
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
    """Register interval jobs for each active product (rebuilt from DB)."""
    scheduler.remove_all_jobs()
    with session_factory() as db:
        products = crud.list_products(db, active_only=True)
    for p in products:
        minutes = max(5, int(p.check_interval_minutes or 60))
        job_id = f"product_{p.id}"

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

        scheduler.add_job(
            make_runner(p.id),
            "interval",
            minutes=minutes,
            id=job_id,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
    log.info("scheduler jobs registered count=%s", len(products))
