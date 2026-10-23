from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ...master.core.uploads import delete_local_upload, save_image_upload
from ...master.database.connection import get_db
from ...master.schemas.character_schema import CharacterRead, CharacterUpdateByPlayer
from ...master.utils.auth_dependencies import CurrentUser, get_current_player
from ..services.player_character_services import (
    get_all_player_characters,
    get_player_character,
    update_player_character,
)

router = APIRouter(prefix="/my-characters", tags=["player"])

_FORBIDDEN = "You don't have permission to access this character"


@router.get("/", response_model=list[CharacterRead])
def read_my_characters(player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Personagens do jogador logado (lista vazia se não houver nenhum)."""
    return get_all_player_characters(db, user_id=player.user_id)


@router.get("/{character_id}", response_model=CharacterRead)
def read_my_character(character_id: int, player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    character = get_player_character(db, character_id=character_id, user_id=player.user_id)
    if character is None:
        raise HTTPException(status_code=403, detail=_FORBIDDEN)
    return character


@router.put("/{character_id}", response_model=CharacterRead)
def update_my_character(
    character_id: int,
    character_update: CharacterUpdateByPlayer,
    player: CurrentUser = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """O jogador só pode alterar codinome, descrição e retrato."""
    character = update_player_character(db, character_id=character_id, user_id=player.user_id, character_update=character_update)
    if character is None:
        raise HTTPException(status_code=403, detail=_FORBIDDEN)
    return character


@router.post("/{character_id}/portrait")
async def upload_portrait(
    character_id: int,
    file: UploadFile = File(...),
    player: CurrentUser = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Envia um retrato (PNG, JPEG ou WebP, até MAX_UPLOAD_BYTES)."""
    character = get_player_character(db, character_id=character_id, user_id=player.user_id)
    if character is None:
        raise HTTPException(status_code=403, detail=_FORBIDDEN)

    public_url = await save_image_upload(file, subdir="portraits", prefix=f"char_{character_id}")
    previous = character.portrait
    character.portrait = public_url
    db.commit()
    if previous != public_url:
        delete_local_upload(previous)
    return {"ok": True, "portrait": public_url}
