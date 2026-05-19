from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime, timedelta

from ..database.connection import get_db
from ..models.character_model import Character
from ..models.user_model import User
from ..models.raca_model import Raca
from ..models.classe_model import Classe
from ...player.controllers.player_panel_controller import _serialize_character
from ..utils.auth_dependencies import get_current_master, CurrentUser
from ..utils.inventory_manager import inventory_manager
from ..models.master_audit_model import MasterAudit

router = APIRouter(prefix="/master/characters", tags=["master-characters"])


def _parse_effects(raw_value):
    if not raw_value:
        return []
    if isinstance(raw_value, list):
        return raw_value
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _dump_effects(effects):
    return json.dumps(effects, ensure_ascii=True)


def _add_timed_effect(raw_value, effect_name: str, duration_seconds: int | None):
    effects = _parse_effects(raw_value)
    payload = {"name": effect_name}
    if duration_seconds and duration_seconds > 0:
        payload["expires_at"] = (datetime.utcnow() + timedelta(seconds=int(duration_seconds))).isoformat()
    effects.append(payload)
    return _dump_effects(effects)


def _remove_effect(raw_value, effect_name: str):
    effects = _parse_effects(raw_value)
    filtered = [effect for effect in effects if str(effect.get("name", "")).lower() != effect_name.lower()]
    return _dump_effects(filtered)


def _character_summary(character: Character):
    owner = character.user
    is_online = False
    if owner:
        try:
            is_online = inventory_manager.get_user_subscribers_count(int(owner.id)) > 0
        except Exception:
            is_online = False

    return {
        "id": character.id,
        "name": character.name,
        "codename": character.codename,
        "description": character.description,
        "portrait": character.portrait,
        "hp": character.hp,
        "max_hp": character.max_hp,
        "mana": character.mana,
        "max_mana": character.max_mana,
        "buffs": character.buffs,
        "debuffs": character.debuffs,
        "tipo": character.tipo,
        "status": character.tipo,
        "visibility": character.visibility,
        "is_dead": character.tipo == "dead",
        "is_npc": character.tipo != "player",
        "is_online": is_online if character.user_id else False,
        "owner": {
            "id": owner.id,
            "login": owner.login,
            "role": owner.role,
            "is_active": owner.is_active,
        }
        if owner
        else None,
        "race": {
            "id": character.raca.id if character.raca else None,
            "name": character.raca.name if character.raca else None,
            "image": character.raca.image if character.raca else None,
        },
        "class": character.classe.name if character.classe else None,
        "current_map": {
            "id": character.current_map.id,
            "name": character.current_map.name,
        }
        if character.current_map
        else None,
    }


@router.get("/")
def list_master_characters(db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    characters = (
        db.query(Character)
        .options(
            # eager load for the dashboard summary
        )
        .order_by(Character.id.asc())
        .all()
    )

    # hydrate relationships lazily for summary building
    summaries = []
    for character in characters:
        _ = character.user
        _ = character.raca
        _ = character.classe
        _ = character.current_map
        summaries.append(_character_summary(character))

    return summaries


@router.get("/{character_id}/audit")
def read_character_audit(character_id: int, limit: int = 50, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    entries = (
        db.query(MasterAudit)
        .filter(MasterAudit.character_id == character_id)
        .order_by(MasterAudit.created_at.desc())
        .limit(max(1, min(limit, 200)))
        .all()
    )
    return [
        {
            "id": entry.id,
            "master_id": entry.master_id,
            "character_id": entry.character_id,
            "action": entry.action,
            "payload": entry.payload,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        }
        for entry in entries
    ]


@router.post("/{character_id}/visibility")
async def set_character_visibility(character_id: int, visibility: dict, current_master: CurrentUser = Depends(get_current_master), db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    try:
        character.visibility = json.dumps(visibility)
        db.add(character)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    # Broadcast new visibility/state to subscribers
    try:
        data = {"action": "visibility_changed", "visibility": visibility}
        # send to character view subscribers
        await inventory_manager.broadcast_character_update(character_id, data)
        # notify owner if exists
        if character.user_id:
            await inventory_manager.broadcast_to_user(character.user_id, "character_visibility_changed", {"character_id": character_id, "visibility": visibility})
    except Exception:
        pass

    return {"ok": True}


@router.post("/{character_id}/apply")
async def apply_character_quick_update(character_id: int, payload: dict, current_master: CurrentUser = Depends(get_current_master), db: Session = Depends(get_db)):
    """Aplicações rápidas de estado: dano, cura, buffs, debuffs, alterações narrativas.
    Payload exemplo: {"hp": -10} ou {"hp": 20, "buffs": ["shield"]}
    """
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Enforce policy: Masters are not allowed to directly change HP/Mana via this endpoint.
    forbidden_keys = {"hp", "mana", "set_hp", "set_mana"}
    if any(k in payload for k in forbidden_keys):
        raise HTTPException(status_code=403, detail="Masters are not allowed to directly modify HP or Mana. Use buffs/debuffs or fight actions instead.")
    if payload.get("buffs") is not None:
        character.buffs = payload.get("buffs") if isinstance(payload.get("buffs"), str) else json.dumps(payload.get("buffs"))
    if payload.get("debuffs") is not None:
        character.debuffs = payload.get("debuffs") if isinstance(payload.get("debuffs"), str) else json.dumps(payload.get("debuffs"))
    if payload.get("add_buff"):
        character.buffs = _add_timed_effect(character.buffs, str(payload["add_buff"]), payload.get("buff_duration_seconds"))
    if payload.get("remove_buff"):
        character.buffs = _remove_effect(character.buffs, str(payload["remove_buff"]))
    if payload.get("add_debuff"):
        character.debuffs = _add_timed_effect(character.debuffs, str(payload["add_debuff"]), payload.get("debuff_duration_seconds"))
    if payload.get("remove_debuff"):
        character.debuffs = _remove_effect(character.debuffs, str(payload["remove_debuff"]))

    try:
        db.add(character)
        db.commit()
        db.refresh(character)
    except Exception:
        db.rollback()

    # Log master audit
    try:
        if current_master and getattr(current_master, 'user_id', None):
            audit = MasterAudit(master_id=current_master.user_id, character_id=character_id, action='apply', payload=json.dumps(payload))
            db.add(audit)
            db.commit()
    except Exception:
        db.rollback()

    # Broadcast to subscribers
    try:
        data = {
            "action": "apply",
            "payload": payload,
            "character": _character_summary(character),
        }
        await inventory_manager.broadcast_character_update(character_id, data)
        if character.user_id:
            await inventory_manager.broadcast_to_user(character.user_id, "character_applied", {"character_id": character_id, "payload": payload})
    except Exception:
        pass

    return {"ok": True}
