"""Remove buffs/debuffs vencidos e avisa quem está acompanhando o personagem."""

import asyncio
import json
import logging
from datetime import datetime

from sqlalchemy import or_

from ..core.time import utcnow
from ..database.connection import SessionLocal
from ..models.character_model import Character
from .inventory_manager import inventory_manager

logger = logging.getLogger(__name__)


def _load_effects(raw) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except (TypeError, json.JSONDecodeError):
        return []
    return parsed if isinstance(parsed, list) else []


def _is_expired(effect, now: datetime) -> bool:
    if not isinstance(effect, dict) or not effect.get("expires_at"):
        return False
    try:
        return datetime.fromisoformat(effect["expires_at"]) <= now
    except (TypeError, ValueError):
        return False


def _drop_expired(raw, now: datetime) -> tuple[list, bool]:
    effects = _load_effects(raw)
    remaining = [effect for effect in effects if not _is_expired(effect, now)]
    return remaining, len(remaining) != len(effects)


def expire_effects() -> list[tuple[int, int | None, list, list]]:
    """Uma passada: remove efeitos vencidos. Devolve (id, user_id, buffs, debuffs) dos alterados."""
    now = utcnow()
    changed = []
    with SessionLocal() as db:
        characters = db.query(Character).filter(or_(Character.buffs.isnot(None), Character.debuffs.isnot(None))).all()
        for character in characters:
            buffs, buffs_changed = _drop_expired(character.buffs, now)
            debuffs, debuffs_changed = _drop_expired(character.debuffs, now)
            if buffs_changed:
                character.buffs = json.dumps(buffs)
            if debuffs_changed:
                character.debuffs = json.dumps(debuffs)
            if buffs_changed or debuffs_changed:
                changed.append((character.id, character.user_id, buffs, debuffs))
        if changed:
            db.commit()
    return changed


async def run_effects_loop(interval_seconds: int = 5) -> None:
    while True:
        await asyncio.sleep(interval_seconds)
        try:
            for character_id, user_id, buffs, debuffs in await asyncio.to_thread(expire_effects):
                await inventory_manager.broadcast_character_update(
                    character_id,
                    {"action": "effects_expired", "character": {"id": character_id, "buffs": buffs, "debuffs": debuffs}},
                )
                if user_id:
                    await inventory_manager.broadcast_to_user(
                        user_id, "character_effects_updated", {"character_id": character_id}
                    )
        except Exception:
            logger.exception("Error in effects loop")
