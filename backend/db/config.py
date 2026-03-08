"""DB configuration for StyleAttack.

Use DATABASE_URL env var. Defaults to a local SQLite file:
    sqlite:///./styleattack.db

Postgres example:
    postgresql+psycopg2://styleattack:styleattack@localhost:5432/styleattack
"""

import os

DEFAULT_SQLITE_URL = "sqlite:///./styleattack.db"

def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
