import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

load_dotenv()

# Read Postgres connecting String from .env
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL is not set. Check your .env file.")


# set up db engine
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    #Create tables if they do not exist yet.
    SQLModel.metadata.create_all(engine)

def get_session():
    #Get a DB session (used in endpoints).
    session = Session(engine)
    return session
