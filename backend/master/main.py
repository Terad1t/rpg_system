import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError

from ..player.controllers.player_character_controller import router as player_character_router
from ..player.controllers.player_panel_controller import router as player_panel_router
from . import models  # noqa: F401  (registra todos os modelos no metadata)
from .controllers.auth_controller import router as auth_router
from .controllers.character_attribute_controller import router as character_attribute_router
from .controllers.character_controller import router as character_router
from .controllers.character_habilidade_controller import router as character_habilidade_router
from .controllers.character_request_controller import router as character_request_router
from .controllers.chat_controller import router as chat_router
from .controllers.classe_controller import router as classe_router
from .controllers.country_controller import router as country_router
from .controllers.fight_controller import router as fight_router
from .controllers.habilidades_controller import router as habilidades_router
from .controllers.inventario_controller import router as inventario_router
from .controllers.item_controller import router as item_router
from .controllers.map_controller import router as map_router
from .controllers.master_buff_controller import router as master_buff_router
from .controllers.master_character_controller import router as master_character_router
from .controllers.master_overview_controller import router as master_overview_router
from .controllers.player_notes_controller import router as player_notes_router
from .controllers.raca_controller import router as raca_router
from .controllers.region_controller import router as region_router
from .controllers.update_controller import router as update_router
from .controllers.village_controller import router as village_router
from .controllers.websocket_controller import router as websocket_router
from .core import tasks
from .core.config import get_settings
from .database.connection import Base, engine
from .utils.effects_manager import run_effects_loop
from .utils.schema_migration import ensure_schema_updates

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("rpg_system")

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    added = ensure_schema_updates(engine)
    if added:
        logger.info("Schema atualizado: %s", ", ".join(added))
    tasks.spawn(run_effects_loop(settings.effects_interval_seconds))
    yield
    await tasks.cancel_all()


app = FastAPI(title="RPG System API", version="1.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,  # autenticação é por header Bearer, não por cookie
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Master-Bootstrap-Token"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(_request: Request, exc: IntegrityError):
    """Violação de chave/unique vira 409 em vez de erro 500 genérico."""
    logger.warning("Integrity error: %s", exc.orig)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Operation conflicts with existing data (duplicate value or record still in use)"},
    )


settings.static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


# A ordem importa: rotas fixas como /characters/requests precisam vir antes
# de /characters/{character_id}.
API_ROUTERS = [
    auth_router,
    chat_router,
    update_router,
    character_request_router,
    character_router,
    character_attribute_router,
    character_habilidade_router,
    inventario_router,
    habilidades_router,
    region_router,
    country_router,
    village_router,
    map_router,
    item_router,
    raca_router,
    classe_router,
    player_notes_router,
    fight_router,
    master_character_router,
    master_overview_router,
    master_buff_router,
    player_character_router,
    player_panel_router,
]
for router in API_ROUTERS:
    app.include_router(router, prefix="/api")

app.include_router(websocket_router)
