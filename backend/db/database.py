"""SQLAlchemy engine/session setup (works with Postgres or SQLite)."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .config import get_database_url

def make_engine(echo: bool = False):
    url = get_database_url()
    connect_args = {}
    # SQLite needs this for multithreaded dev servers.
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(url, echo=echo, future=True, connect_args=connect_args)

_ENGINE = None
_SessionLocal = None

def get_engine():
    global _ENGINE, _SessionLocal
    if _ENGINE is None:
        _ENGINE = make_engine()
        _SessionLocal = sessionmaker(bind=_ENGINE, autoflush=False, autocommit=False, future=True)
    return _ENGINE

def get_session() -> Session:
    """Create a new DB session. Caller should close() it."""
    global _SessionLocal
    if _SessionLocal is None:
        get_engine()
    return _SessionLocal()
