# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .controllers.player_controller import router as player_router
from .controllers.character_controller import router as character_router
from .controllers.habilidades_controller import router as habilidades_router
from .controllers.region_controller import router as region_router
from .controllers.country_controller import router as country_router
from .controllers.village_controller import router as village_router
from .controllers.map_controller import router as map_router
from .controllers.character_request_controller import router as character_request_router
from .controllers.player_notes_controller import router as player_notes_router
from .controllers.character_habilidade_controller import router as character_habilidade_router
from .controllers.auth_controller import router as auth_router
from .controllers.chat_controller import router as chat_router
from .controllers.update_controller import router as update_router
from .database.connection import engine, Base, SessionLocal
import sys
import os

# Adiciona o caminho para importar o módulo player
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importa rotas do player
from ..player.controllers.player_character_controller import router as player_character_router

# Importa todos os modelos para criar as tabelas
from .models import (
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
    region_model,
    country_model,
    village_model,
    user_model,
    chat_message_model,
    map_model,
    character_request_model,
    player_notes_model,
    character_habilidade_model,
)

from .services.auth_services import initialize_master_if_not_exists

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# Inicializa o Master se não existir
db = SessionLocal()
try:
    initialize_master_if_not_exists(db)
finally:
    db.close()

app = FastAPI(title="RPG System API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Authentication Routes ==========
app.include_router(auth_router)

# ========== Chat Routes ==========
app.include_router(chat_router)

# ========== Update Routes ==========
app.include_router(update_router)

# ========== Master Routes ==========
app.include_router(player_router)
app.include_router(character_router)
app.include_router(habilidades_router)
app.include_router(region_router)
app.include_router(country_router)
app.include_router(village_router)
app.include_router(map_router)
app.include_router(character_request_router)
app.include_router(player_notes_router)
app.include_router(character_habilidade_router)

# ========== Player Routes ==========
app.include_router(player_character_router)