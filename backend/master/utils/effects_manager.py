import asyncio
import json
import logging
from datetime import datetime

from ..database.connection import SessionLocal
from ..models.character_model import Character
from .inventory_manager import inventory_manager


async def start_effects_loop(interval_seconds: int = 5):
    """Loop que verifica buffs/debuffs expirados e remove-os, então broadcast para inscritos."""
    while True:
        db = None
        try:
            db = SessionLocal()
            characters = db.query(Character).all()
            changed = []
            now = datetime.utcnow()
            for character in characters:
                updated = False

                # process buffs
                if character.buffs:
                    try:
                        buffs = character.buffs if isinstance(character.buffs, list) else json.loads(character.buffs)
                    except Exception:
                        buffs = []

                    new_buffs = []
                    for b in buffs:
                        if isinstance(b, dict) and b.get('expires_at'):
                            try:
                                exp = datetime.fromisoformat(b.get('expires_at'))
                            except Exception:
                                exp = None
                            if exp and exp <= now:
                                updated = True
                                continue
                        new_buffs.append(b)

                    if updated:
                        character.buffs = json.dumps(new_buffs)

                # process debuffs
                if character.debuffs:
                    try:
                        debuffs = character.debuffs if isinstance(character.debuffs, list) else json.loads(character.debuffs)
                    except Exception:
                        debuffs = []

                    new_debuffs = []
                    for d in debuffs:
                        if isinstance(d, dict) and d.get('expires_at'):
                            try:
                                exp = datetime.fromisoformat(d.get('expires_at'))
                            except Exception:
                                exp = None
                            if exp and exp <= now:
                                updated = True
                                continue
                        new_debuffs.append(d)

                    if updated:
                        character.debuffs = json.dumps(new_debuffs)

                if updated:
                    db.add(character)
                    changed.append(character)

            if changed:
                db.commit()
                for c in changed:
                    try:
                        data = {
                            "action": "effects_expired",
                            "character": {
                                "id": c.id,
                                "buffs": json.loads(c.buffs) if c.buffs else [],
                                "debuffs": json.loads(c.debuffs) if c.debuffs else [],
                            },
                        }
                        await inventory_manager.broadcast_character_update(c.id, data)
                        if c.user_id:
                            await inventory_manager.broadcast_to_user(c.user_id, "character_effects_updated", {"character_id": c.id})
                    except Exception:
                        logging.exception("Failed to broadcast effects update for character %s", c.id)

        except Exception:
            logging.exception("Error in effects loop")
        finally:
            if db:
                try:
                    db.close()
                except Exception:
                    pass
        await asyncio.sleep(interval_seconds)
