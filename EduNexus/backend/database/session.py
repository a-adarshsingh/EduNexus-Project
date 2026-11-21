from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core import config
from ..models.tables import Base

if config.IS_SQLITE:
    engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(config.DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=5)
SessionLocal = sessionmaker(bind=engine, autoflush=False)

def init_db(): Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
