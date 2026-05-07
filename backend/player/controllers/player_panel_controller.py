from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ...master.database.connection import get_db
from ...master.models.character_model import Character
from ...master.models.raca_model import Raca
from ...master.models.inventario_model import Inventario
from ...master.models.item_model import Item
from ...master.utils.auth_dependencies import get_current_player, CurrentUser
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
        "tipo": character.tipo,
        "status": character.tipo,
        "class": character.classe.name if character.classe else "Desconhecida",
        "level": 1,
        "hp": 0,
        "maxHp": 0,
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