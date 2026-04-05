from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL do banco de dados (usando SQLite para simplicidade)
DATABASE_URL = "sqlite:///./rpg_system.db"

# Cria o engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Cria a sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Função para obter a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()