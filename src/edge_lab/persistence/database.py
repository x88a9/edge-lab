import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://edge:edge@localhost:5433/edge_lab"
)

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass
