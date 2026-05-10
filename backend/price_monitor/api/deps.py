from collections.abc import Generator

from fastapi import Request
from sqlalchemy.orm import Session

from price_monitor.db import get_db as _get_db


def get_db(request: Request) -> Generator[Session, None, None]:
    yield from _get_db(request.app.state.session_factory)


def get_settings(request: Request):
    return request.app.state.settings


def reschedule_jobs(request: Request):
    yield
    request.app.state.rebuild_scheduler()
