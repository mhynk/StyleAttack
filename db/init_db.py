# init_db.py
from sqlmodel import SQLModel
from db.database import engine


def init_db():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    init_db()
    print("DB initialized.")