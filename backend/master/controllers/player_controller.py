# controllers/player_controller.py
from fastapi import APIRouter, HTTPException
from schemas.player_schema import PlayerCreate, PlayerUpdate
import services.player_services as service


router = APIRouter()

@router.get("/players")
def get_players(alive_only: bool = True, min_hp: int = 0):
    return service.get_players(alive_only=alive_only, min_hp=min_hp)

@router.post("/players")
def create_player(player: PlayerCreate):
    return service.create_player(player)

@router.patch("/players/{player_id}")
def update_player(player_id: int, player: PlayerUpdate):
    updated = service.update_player(player_id, player)
    if not updated:
        raise HTTPException(status_code=404, detail="Player not found")
    return updated

@router.delete("/players/{player_id}")
def delete_player(player_id: int):
    deleted = service.delete_player(player_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Deleted"}