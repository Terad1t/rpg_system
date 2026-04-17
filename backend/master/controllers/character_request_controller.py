from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta

from ..database.connection import get_db
from ..schemas.character_request_schema import (
    CharacterRequestCreate,
    CharacterRequestRead,
    CharacterApproval,
)
from ..services.character_request_services import (
    create_character_request,
    get_requests,
    get_request_by_id,
    approve_request,
    expire_pending_requests,
)
from ..models.character_request_model import CharacterRequest
from ..models.character_model import Character
from ..models.user_model import User
from ..utils.auth_dependencies import get_current_player, get_current_master, get_current_user
from ..schemas.update_schema import CharacterUpdateEvent
from ..utils.broadcast import broadcast_manager
from ..utils.inventory_manager import inventory_manager
from ..models.raca_model import Raca
from ..models.classe_model import Classe

router = APIRouter(prefix="/characters/requests", tags=["character-requests"])


@router.post("/", response_model=CharacterRequestRead)
async def create_request(
    payload: CharacterRequestCreate,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db),
):
    user_id = int(current_player.user_id)

    # Expira automaticamente requests pendentes antigas (2 dias) antes de validar/criar
    expire_pending_requests(db)

    # referential checks
    raca = db.query(Raca).filter(Raca.id == payload.raca_id).first()
    if not raca:
        raise HTTPException(status_code=404, detail="Race (raca) not found")
    classe = db.query(Classe).filter(Classe.id == payload.classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Class (classe) not found")

    # Limite: 3 solicitações por jogador a cada 24h
    now = datetime.utcnow()
    since = now - timedelta(days=1)
    requests_last_24h = (
        db.query(func.count(CharacterRequest.id))
        .filter(CharacterRequest.user_id == user_id)
        .filter(CharacterRequest.created_at >= since)
        .scalar()
        or 0
    )
    if requests_last_24h >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached: max 3 character requests per 24h.",
        )

    # Limite: 2 personagens ativos (tipo=player) por jogador
    active_characters = (
        db.query(func.count(Character.id))
        .filter(Character.user_id == user_id)
        .filter(Character.tipo == "player")
        .scalar()
        or 0
    )
    if active_characters >= 2:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Character limit reached: max 2 active player characters.",
        )

    req = create_character_request(db, user_id=user_id, payload=payload.model_dump())

    # Notifica todos os masters conectados via WebSocket (caixinha de notificações)
    masters = (
        db.query(User.id)
        .filter(User.role == "master")
        .filter(User.is_active == True)  # noqa: E712
        .all()
    )
    player = db.query(User).filter(User.id == user_id).first()
    notification_data = {
        "request_id": req.id,
        "player_id": user_id,
        "player_login": player.login if player else None,
        "name": req.name,
        "codename": req.codename,
        "raca": {"id": raca.id, "name": raca.name},
        "classe": {"id": classe.id, "name": classe.name},
        "created_at": req.created_at.isoformat() if req.created_at else None,
    }
    for (master_id,) in masters:
        await inventory_manager.broadcast_to_user(
            master_id,
            "character_request_created",
            notification_data,
        )

    return req


@router.get("/my", response_model=list[CharacterRequestRead])
def my_requests(current_player=Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)
    expire_pending_requests(db)
    return db.query(CharacterRequest).filter(CharacterRequest.user_id == user_id).all()


# Master endpoints
@router.get("/", response_model=list[CharacterRequestRead])
def list_requests(status: str | None = None, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    return get_requests(db, status=status)


@router.post("/{request_id}/approve")
async def approve(
    request_id: int,
    approval: CharacterApproval,
    db: Session = Depends(get_db),
    current_master=Depends(get_current_master),
):
    master_id = int(current_master.user_id)
    character = approve_request(
        db,
        request_id=request_id,
        approval_data=approval.model_dump(),
        master_user_id=master_id,
    )
    if character is None:
        raise HTTPException(status_code=404, detail="Request not found or invalid")

    event = CharacterUpdateEvent(data={"action": "created", "character_id": character.id})
    await broadcast_manager.broadcast(event)
    return character


@router.post("/{request_id}/reject", response_model=CharacterRequestRead)
async def reject(
    request_id: int,
    db: Session = Depends(get_db),
    current_master=Depends(get_current_master),
):
    master_id = int(current_master.user_id)

    expire_pending_requests(db)

    req = db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Request not found or invalid")

    req.status = "rejected"
    req.approved_by = master_id
    req.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(req)

    # Notifica o player solicitante
    await inventory_manager.broadcast_to_user(
        req.user_id,
        "character_request_rejected",
        {
            "request_id": req.id,
            "name": req.name,
            "codename": req.codename,
            "rejected_by": master_id,
            "rejected_at": req.approved_at.isoformat() if req.approved_at else None,
        },
    )

    return req
