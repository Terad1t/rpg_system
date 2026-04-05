# main.py
from fastapi import FastAPI
from controllers.player_controller import router as player_router
from controllers.character_controller import router as character_router
from controllers.habilidades_controller import router as habilidades_router
from database.connection import engine, Base

# Importa todos os modelos para criar as tabelas
from models import (
    character_model,
    attribute_model,
    raca_model,
    raca_bonus_model,
    classe_model,
    item_model,
    inventario_model,
    batalha_model,
    batalha_participante_model,
    habilidades_model,
)

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(player_router)
app.include_router(character_router)
app.include_router(habilidades_router)