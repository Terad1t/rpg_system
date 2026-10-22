import json
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..core.time import utcnow
from ..database.connection import get_db
from ..models.character_model import Character
from ..models.master_audit_model import MasterAudit
from ..schemas.master_character_schema import CharacterQuickUpdate, CharacterVisibility
from ..utils.auth_dependencies import CurrentUser, get_current_master
from ..utils.inventory_manager import inventory_manager

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
        payload["expires_at"] = (utcnow() + timedelta(seconds=int(duration_seconds))).isoformat()
    effects.append(payload)
    return _dump_effects(effects)


def _remove_effect(raw_value, effect_name: str):
    effects = _parse_effects(raw_value)
    filtered = [effect for effect in effects if str(effect.get("name", "")).lower() != effect_name.lower()]
    return _dump_effects(filtered)


def _character_summary(character: Character):
    owner = character.user
    is_online = bool(owner) and inventory_manager.get_user_subscribers_count(int(owner.id)) > 0

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
            joinedload(Character.user),
            joinedload(Character.raca),
            joinedload(Character.classe),
            joinedload(Character.current_map),
        )
        .order_by(Character.id.asc())
        .all()
    )
    return [_character_summary(character) for character in characters]


@router.get("/{character_id}/audit")
def read_character_audit(
    character_id: int, limit: int = 50, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)
):
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
async def set_character_visibility(
    character_id: int,
    visibility: CharacterVisibility,
    _master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    character = db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    data = visibility.model_dump()
    character.visibility = json.dumps(data)
    db.commit()

    await inventory_manager.broadcast_character_update(character_id, {"action": "visibility_changed", "visibility": data})
    if character.user_id:
        await inventory_manager.broadcast_to_user(
            character.user_id, "character_visibility_changed", {"character_id": character_id, "visibility": data}
        )
    return {"ok": True}


def _effects_value(value) -> str:
    return value if isinstance(value, str) else json.dumps(value)


@router.post("/{character_id}/apply")
async def apply_character_quick_update(
    character_id: int,
    payload: CharacterQuickUpdate,
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    """Dano/cura (variação de HP e mana), buffs, debuffs e notas narrativas.

    Exemplo: {"hp": -10} ou {"hp": 20, "add_buff": "shield", "buff_duration_seconds": 60}.
    O Master não define HP/mana absolutos por aqui; isso vem de buffs ou da luta.
    """
    character = db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    changes = payload.model_dump(exclude_none=True)

    if payload.hp is not None:
        character.hp = max(0, int(character.hp or 0) + payload.hp)
    if payload.mana is not None:
        character.mana = max(0, int(character.mana or 0) + payload.mana)
    if payload.buffs is not None:
        character.buffs = _effects_value(payload.buffs)
    if payload.debuffs is not None:
        character.debuffs = _effects_value(payload.debuffs)
    if payload.add_buff:
        character.buffs = _add_timed_effect(character.buffs, payload.add_buff, payload.buff_duration_seconds)
    if payload.remove_buff:
        character.buffs = _remove_effect(character.buffs, payload.remove_buff)
    if payload.add_debuff:
        character.debuffs = _add_timed_effect(character.debuffs, payload.add_debuff, payload.debuff_duration_seconds)
    if payload.remove_debuff:
        character.debuffs = _remove_effect(character.debuffs, payload.remove_debuff)

    db.add(MasterAudit(master_id=master.user_id, character_id=character_id, action="apply", payload=json.dumps(changes)))
    db.commit()
    db.refresh(character)

    await inventory_manager.broadcast_character_update(
        character_id, {"action": "apply", "payload": changes, "character": _character_summary(character)}
    )
    if character.user_id:
        await inventory_manager.broadcast_to_user(
            character.user_id, "character_applied", {"character_id": character_id, "payload": changes}
        )
    return {"ok": True}
