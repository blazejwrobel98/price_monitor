import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apscheduler.schedulers.background import BackgroundScheduler

from price_monitor.api.health import router as health_router
from price_monitor.api.products import router as products_router
from price_monitor.config import Settings
from price_monitor.db import make_engine, make_session_factory
from price_monitor.models import Base
from price_monitor.services.scheduler import schedule_product_jobs

log = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    engine = make_engine(settings)
    Base.metadata.create_all(bind=engine)
    session_factory = make_session_factory(engine)
    scheduler = BackgroundScheduler(timezone="UTC")

    def rebuild_scheduler() -> None:
        if not settings.scheduler_enabled:
            return
        schedule_product_jobs(scheduler, session_factory, settings)

    app.state.settings = settings
    app.state.session_factory = session_factory
    app.state.scheduler = scheduler
    app.state.rebuild_scheduler = rebuild_scheduler

    if settings.scheduler_enabled:
        scheduler.start()
        rebuild_scheduler()
        log.info("Background scheduler started.")
    else:
        log.info("Background scheduler disabled (SCHEDULER_ENABLED=false).")

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    app = FastAPI(title="Price Monitor", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router, prefix="/api")
    app.include_router(products_router, prefix="/api")

    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app


app = create_app()
