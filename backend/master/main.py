# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .controllers.player_controller import router as player_router
from .controllers.character_controller import router as character_router
from .controllers.habilidades_controller import router as habilidades_router
from .controllers.region_controller import router as region_router
from .controllers.country_controller import router as country_router
from .controllers.village_controller import router as village_router
from .controllers.map_controller import router as map_router
from .controllers.character_request_controller import router as character_request_router
from .controllers.character_attribute_controller import router as character_attribute_router
from .controllers.item_controller import router as item_router
from .controllers.websocket_controller import router as websocket_router
from .controllers.raca_controller import router as raca_router
from .controllers.classe_controller import router as classe_router
from .controllers.player_notes_controller import router as player_notes_router
from .controllers.character_habilidade_controller import router as character_habilidade_router
from .controllers.inventario_controller import router as inventario_router
from .controllers.auth_controller import router as auth_router
from .controllers.chat_controller import router as chat_router
from .controllers.update_controller import router as update_router
from .controllers.fight_controller import router as fight_router
from .utils.schema_migration import ensure_schema_updates
from .database.connection import Base, engine
import sys
import os
import asyncio

# Adiciona o caminho para importar o módulo player
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importa rotas do player
from ..player.controllers.player_character_controller import router as player_character_router
from ..player.controllers.player_panel_controller import router as player_panel_router
from .controllers.master_character_controller import router as master_character_router
from .controllers.master_buff_controller import router as master_buff_router

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
    fight_model,
    fight_entry_model,
    habilidades_model,
    region_model,
    country_model,
    village_model,
    user_model,
    chat_message_model,
    inventory_log_model,
    map_model,
    character_request_model,
    character_attribute_model,
    player_notes_model,
    attribute_distribution_log_model,
    character_habilidade_model,
    master_audit_model,
    buff_debuff_model,
)

from .services.auth_services import initialize_master_if_not_exists

app = FastAPI(title="RPG System API", version="1.0.0")


@app.on_event("startup")
def _ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_schema_updates()


@app.on_event("startup")
async def _start_background_tasks() -> None:
    try:
        from .utils.effects_manager import start_effects_loop
        # spawn background task to clean up expired effects
        asyncio.create_task(start_effects_loop())
    except Exception:
        pass

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ========== Authentication Routes ==========
app.include_router(auth_router, prefix="/api")

# ========== Chat Routes ==========
app.include_router(chat_router, prefix="/api")

# ========== Update Routes ==========
app.include_router(update_router, prefix="/api")

# ========== Master Routes ==========
app.include_router(player_router, prefix="/api")
app.include_router(character_router, prefix="/api")
app.include_router(habilidades_router, prefix="/api")
app.include_router(region_router, prefix="/api")
app.include_router(country_router, prefix="/api")
app.include_router(village_router, prefix="/api")
app.include_router(map_router, prefix="/api")
app.include_router(character_request_router, prefix="/api")
app.include_router(item_router, prefix="/api")
app.include_router(character_attribute_router, prefix="/api")
app.include_router(raca_router, prefix="/api")
app.include_router(classe_router, prefix="/api")
app.include_router(player_notes_router, prefix="/api")
app.include_router(character_habilidade_router, prefix="/api")
app.include_router(inventario_router, prefix="/api")
app.include_router(fight_router, prefix="/api")

# ========== WebSocket Routes ==========
app.include_router(websocket_router)

# ========== Player Routes ==========
app.include_router(player_character_router, prefix="/api")
app.include_router(player_panel_router, prefix="/api")
app.include_router(master_character_router, prefix="/api")
app.include_router(master_buff_router, prefix="/api")