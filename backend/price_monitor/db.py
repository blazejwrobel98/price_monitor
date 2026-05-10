from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from price_monitor.config import Settings


def make_engine(settings: Settings):
    url = settings.resolved_database_url
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(url, connect_args=connect_args)


def make_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db(session_factory: sessionmaker) -> Generator[Session, None, None]:
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
