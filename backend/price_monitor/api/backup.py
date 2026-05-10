"""SQLite backup download and restore (self-hosted)."""

from __future__ import annotations

import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from price_monitor.config import Settings
from price_monitor.db import make_engine, make_session_factory
from price_monitor.migrate import run_database_migrations

log = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])

SQLITE_MAGIC = b"SQLite format 3\x00"
MAX_UPLOAD_BYTES = 52_428_800  # 50 MiB


def _file_sqlite_supported(settings: Settings) -> bool:
    try:
        settings.sqlite_filesystem_path
    except ValueError:
        return False
    return True


@router.get("/backup")
def download_backup(request: Request):
    settings: Settings = request.app.state.settings
    if not _file_sqlite_supported(settings):
        raise HTTPException(
            status_code=400,
            detail="Backup is only available for on-disk SQLite (not in-memory or other drivers).",
        )
    path = settings.sqlite_filesystem_path
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Database file does not exist yet.")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"price-monitor-backup-{stamp}.db"
    return FileResponse(
        path,
        filename=filename,
        media_type="application/vnd.sqlite3",
        content_disposition_type="attachment",
    )


@router.post("/backup")
async def restore_backup(request: Request, file: UploadFile = File(...)):
    settings: Settings = request.app.state.settings
    if not _file_sqlite_supported(settings):
        raise HTTPException(
            status_code=400,
            detail="Restore is only supported for on-disk SQLite.",
        )

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large.")
    if len(raw) < 16 or not raw.startswith(SQLITE_MAGIC):
        raise HTTPException(status_code=400, detail="Not a valid SQLite 3 database file.")

    app = request.app
    scheduler: BackgroundScheduler = app.state.scheduler
    old_engine = app.state.engine

    if scheduler.running:
        scheduler.shutdown(wait=True)

    old_engine.dispose()

    db_path = settings.sqlite_filesystem_path
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    if db_path.is_file():
        bak = db_path.with_suffix(".bak")
        try:
            shutil.copy2(db_path, bak)
        except OSError:
            log.warning("Could not write backup copy to %s", bak)

    tmp = db_path.with_name(db_path.name + ".upload-tmp")
    try:
        tmp.write_bytes(raw)
        tmp.replace(db_path)
    except OSError as e:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to write database: {e}") from e

    run_database_migrations(settings)
    new_engine = make_engine(settings)
    new_session_factory = make_session_factory(new_engine)

    app.state.engine = new_engine
    app.state.session_factory = new_session_factory

    new_scheduler = BackgroundScheduler(timezone="UTC")
    app.state.scheduler = new_scheduler
    if settings.scheduler_enabled:
        new_scheduler.start()
        app.state.rebuild_scheduler()

    log.info("Database restored from upload (%s bytes)", len(raw))
    return {"status": "ok", "message": "Database restored. Scheduler reloaded."}
