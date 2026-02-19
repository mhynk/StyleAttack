"""Create DB tables.

Run from backend/:

  python -m db.init_db

(Uses DATABASE_URL from environment; defaults to SQLite ./styleattack.db)
"""

try:
    from db.database import get_engine
    from db.models import Base
except ImportError:  # pragma: no cover
    from .database import get_engine
    from .models import Base

def main():
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("✅ DB initialized (tables created if missing).")

if __name__ == "__main__":
    main()
