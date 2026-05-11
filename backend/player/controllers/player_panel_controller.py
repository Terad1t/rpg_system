from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ...master.database.connection import get_db
from ...master.models.character_model import Character
from ...master.models.raca_model import Raca
from ...master.models.inventario_model import Inventario
from ...master.models.item_model import Item
from ...master.utils.auth_dependencies import get_current_player, CurrentUser, get_current_user
from ...master.utils.inventory_manager import inventory_manager
import json
from ...master.services.map_services import build_map_tree

router = APIRouter(prefix="/player-panel", tags=["player-panel"])


def _serialize_item(item: Item | None):
    if item is None:
        return None
    return {
        "id": item.id,
        "name": item.name,
        "tipo": item.tipo,
        "image": item.image,
        "description": item.description,
        "buffs": item.buffs,
        "nerfs": item.nerfs,
        "quantity": item.quantity,
        "quantidade_maxima": item.quantidade_maxima,
    }


def _serialize_character(character: Character):
    attributes = {}
    for attribute in getattr(character, "attributes", []) or []:
        attributes[attribute.name] = attribute.value

    return {
        "id": character.id,
        "name": character.name,
        "codename": character.codename,
        "description": character.description,
        "portrait": character.portrait,
        "hp": character.hp,
        "maxHp": character.max_hp,
        "mana": character.mana,
        "maxMana": character.max_mana,
        "buffs": character.buffs,
        "debuffs": character.debuffs,
        "tipo": character.tipo,
        "status": character.tipo,
        "class": character.classe.name if character.classe else "Desconhecida",
        "level": 1,
        "vigor": 0,
        "maxVigor": 0,
        "xp": 0,
        "maxXp": 0,
        "attributes": attributes,
        "race": {
            "id": character.raca.id if character.raca else None,
            "name": character.raca.name if character.raca else None,
            "description": character.raca.description if character.raca else None,
            "image": character.raca.image if character.raca else None,
        },
        "current_map_id": character.current_map_id,
        "current_map": {
            "id": character.current_map.id,
            "name": character.current_map.name,
            "map_type": character.current_map.map_type,
            "description": character.current_map.description,
            "image": character.current_map.image,
        }
        if character.current_map
        else None,
        "inventory": [
            {
                "id": inventory.id,
                "quantidade": inventory.quantidade,
                "item": _serialize_item(inventory.item),
            }
            for inventory in character.inventario
        ],
    }


def _can_view_by_rule(character: Character, viewer: CurrentUser, vis: dict, db: Session) -> bool:
    rule = vis.get("rule", "public")
    if rule == "public":
        return True

    if rule == "owner_only":
        return False

    if rule == "same_map":
        if character.current_map_id is None:
            return False
        viewer_maps = {
            c.current_map_id
            for c in db.query(Character).filter(Character.user_id == int(viewer.user_id)).all()
            if c.current_map_id is not None
        }
        return character.current_map_id in viewer_maps

    if rule == "same_party":
        # Party model ainda não existe; usa allow_user_ids como fallback explícito.
        allow_user_ids = vis.get("allow_user_ids", [])
        return int(viewer.user_id) in allow_user_ids

    if rule == "friends":
        # Friends model ainda não existe; usa friend_user_ids como fallback explícito.
        friend_user_ids = vis.get("friend_user_ids", [])
        return int(viewer.user_id) in friend_user_ids

    allow_user_ids = vis.get("allow_user_ids", [])
    return int(viewer.user_id) in allow_user_ids


def _serialize_character_for_view(character: Character, viewer: CurrentUser | None = None, db: Session | None = None):
    """Serialize a character according to visibility rules.

    Rules (default):
    - Owner (viewer.user_id == character.user_id) or master role => full serialization
    - If character has user and is offline and viewer is not owner/master => return {"message": "Personagem offline."}
    - NPCs return only public fields (codename, small description, status, portrait)
    - Other players: return a reduced view depending on character.visibility JSON
    """
    # Owner or master => full
    if viewer and (viewer.role == "master" or (character.user_id and int(viewer.user_id) == int(character.user_id))):
        return _serialize_character(character)

    # Check offline
    if character.user_id:
        try:
            is_online = inventory_manager.get_user_subscribers_count(int(character.user_id)) > 0
        except Exception:
            is_online = True

        if not is_online:
            return {"message": "Personagem offline."}

    # NPC handling
    if character.tipo != "player":
        return {
            "id": character.id,
            "codename": character.codename,
            "description": character.description,
            "portrait": character.portrait,
            "status": character.tipo,
        }

    # Player -> apply visibility settings
    vis = {}
    if character.visibility:
        try:
            vis = json.loads(character.visibility)
        except Exception:
            vis = {}

    if viewer and db and not _can_view_by_rule(character, viewer, vis, db):
        return {"message": "Informações privadas deste personagem."}

    public_fields = vis.get("public_fields", ["codename", "race", "class", "status"])

    result = {"id": character.id}
    if "codename" in public_fields:
        result["codename"] = character.codename
    if "race" in public_fields:
        result["race"] = character.raca.name if character.raca else None
    if "class" in public_fields:
        result["class"] = character.classe.name if character.classe else None
    if "status" in public_fields:
        result["status"] = character.tipo
    if "portrait" in public_fields:
        result["portrait"] = character.portrait
    if vis.get("show_hp"):
        result["hp"] = character.hp
        result["maxHp"] = character.max_hp
    if vis.get("show_mana"):
        result["mana"] = character.mana
        result["maxMana"] = character.max_mana
    if vis.get("show_buffs"):
        result["buffs"] = character.buffs
    if vis.get("show_debuffs"):
        result["debuffs"] = character.debuffs

    return result



@router.get("/characters/{character_id}/view")
def view_character(character_id: int, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retorna a visão filtrada de um personagem de acordo com permissões e configurações de visibilidade"""
    character = (
        db.query(Character)
        .options(
            joinedload(Character.raca),
            joinedload(Character.classe),
            joinedload(Character.current_map),
            joinedload(Character.attributes),
            joinedload(Character.inventario).joinedload(Inventario.item),
        )
        .filter(Character.id == character_id)
        .first()
    )

    if not character:
        return {"error": "Character not found"}

    return _serialize_character_for_view(character, current_user, db)


@router.get("/")
def get_player_panel(current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)

    characters = (
        db.query(Character)
        .options(
            joinedload(Character.raca),
            joinedload(Character.classe),
            joinedload(Character.current_map),
            joinedload(Character.attributes),
            joinedload(Character.inventario).joinedload(Inventario.item),
        )
        .filter(Character.user_id == user_id)
        .order_by(Character.id.asc())
        .all()
    )

    races = db.query(Raca).order_by(Raca.name.asc()).all()

    return {
        "characters": [_serialize_character(character) for character in characters],
        "races": [
            {
                "id": race.id,
                "name": race.name,
                "description": race.description,
                "image": race.image,
            }
            for race in races
        ],
        "world_map": build_map_tree(db),
    }