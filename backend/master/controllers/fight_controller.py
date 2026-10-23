from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.tasks import spawn
from ..database.connection import SessionLocal, get_db
from ..models.character_model import Character
from ..schemas.fight_schema import (
    FightCreate,
    FightEntryCreate,
    FightEntryRead,
    FightInviteAnswer,
    FightInviteRequest,
    FightRead,
    FightResponses,
    FightTurnRead,
    FightUpdate,
    PlayerFightAction,
)
from ..services import fight_services
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_player, get_current_user
from ..utils.inventory_manager import inventory_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fights", tags=["fights"])


# ========== HELPERS ==========


async def _notify(user_ids: list[int], notification_type: str, data: dict) -> None:
    for user_id in dict.fromkeys(user_ids):
        await inventory_manager.broadcast_to_user(user_id, notification_type, data)


def _get_fight_or_404(db: Session, fight_id: int):
    fight = fight_services.get_fight(db, fight_id)
    if not fight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fight not found")
    return fight


def _require_master_or_participant(db: Session, fight_id: int, user: CurrentUser) -> None:
    if user.is_master or fight_services.is_participant(db, fight_id, user.user_id):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant of this fight")


def _entry_event(fight_id: int, entry, action: PlayerFightAction | None = None) -> dict:
    return {
        "type": "fight_event",
        "fight_id": fight_id,
        "entry": {
            "id": entry.id,
            "actor_name": entry.actor_name,
            "actor_type": entry.actor_type,
            "actor_character_id": action.actor_character_id if action else None,
            "target_character_id": action.target_character_id if action else None,
            "action": entry.action,
            "value": entry.value,
            "damage": entry.damage,
            "healing": entry.healing,
            "card_id": entry.card_id,
            "timestamp": entry.created_at.isoformat() if entry.created_at else None,
        },
    }


# ========== CRUD (MASTER) ==========


@router.get("/", response_model=list[FightRead])
def read_fights(db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    return fight_services.list_fights(db)


@router.get("/stats")
def read_fight_stats(db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    return fight_services.build_fight_stats(db)


@router.get("/{fight_id}", response_model=FightRead)
def read_fight(fight_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    fight = _get_fight_or_404(db, fight_id)
    _require_master_or_participant(db, fight_id, user)
    return fight


@router.post("/", response_model=FightRead, status_code=status.HTTP_201_CREATED)
def create_new_fight(payload: FightCreate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    return fight_services.create_fight(db, payload)


@router.put("/{fight_id}", response_model=FightRead)
def update_existing_fight(
    fight_id: int,
    payload: FightUpdate,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    fight = fight_services.update_fight(db, fight_id, payload)
    if not fight:
        raise HTTPException(status_code=404, detail="Fight not found")
    return fight


@router.delete("/{fight_id}")
def delete_existing_fight(fight_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    if not fight_services.delete_fight(db, fight_id):
        raise HTTPException(status_code=404, detail="Fight not found")
    return {"message": "Fight deleted successfully"}


# ========== REGISTROS DE COMBATE ==========


@router.post("/{fight_id}/entries", response_model=FightEntryRead, status_code=status.HTTP_201_CREATED)
async def add_entry(
    fight_id: int,
    payload: FightEntryCreate,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    entry = fight_services.add_fight_entry(db, fight_id, payload)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight not found")
    await _notify(fight_services.participant_ids(db, fight_id), "fight_event", _entry_event(fight_id, entry))
    return entry


@router.delete("/{fight_id}/entries/{entry_id}", response_model=FightEntryRead)
def delete_entry(fight_id: int, entry_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    entry = fight_services.delete_fight_entry(db, fight_id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight entry not found")
    return entry


@router.post("/{fight_id}/entries/player", status_code=status.HTTP_201_CREATED)
async def player_add_entry(
    fight_id: int,
    action: PlayerFightAction,
    db: Session = Depends(get_db),
    player: CurrentUser = Depends(get_current_player),
):
    """Ação do jogador na luta. A vez é conferida antes de gravar qualquer coisa."""
    fight = _get_fight_or_404(db, fight_id)
    if not fight_services.is_participant(db, fight_id, player.user_id):
        raise HTTPException(status_code=403, detail="You are not a participant of this fight")

    if action.action != "ready":
        if (fight.status or "").lower() != "in_progress":
            raise HTTPException(status_code=400, detail="Fight not in progress")
        turn = fight_services.get_turn(db, fight_id)
        if turn and turn.current_user_id and turn.current_user_id != player.user_id:
            raise HTTPException(status_code=403, detail="Not your turn")

    actor_name = player.login or f"user:{player.user_id}"
    if action.actor_character_id is not None:
        character = db.get(Character, action.actor_character_id)
        if not character or character.user_id != player.user_id:
            raise HTTPException(status_code=403, detail="This character does not belong to you")
        actor_name = character.codename or character.name

    entry = fight_services.add_fight_entry(
        db,
        fight_id,
        FightEntryCreate(
            actor_type="player",
            actor_name=actor_name,
            damage=action.value if action.action == "attack" else 0,
            healing=action.value if action.action == "heal" else 0,
            action=action.action,
            value=action.value,
            card_id=action.card_id,
        ),
    )

    recipients = fight_services.participant_ids(db, fight_id) + [player.user_id]
    await _notify(recipients, "fight_event", _entry_event(fight_id, entry, action=action))
    return {"message": "entry recorded", "entry_id": entry.id}


# ========== CONVITES ==========


async def _close_invite_window(fight_id: int, master_id: int, delay: int) -> None:
    await asyncio.sleep(delay)
    db = SessionLocal()
    try:
        summary = fight_services.close_invite_window(db, fight_id)
    finally:
        db.close()
    await _notify([master_id], "fight_invite_results", summary)


@router.post("/{fight_id}/invite")
async def invite_players(
    fight_id: int,
    payload: FightInviteRequest,
    db: Session = Depends(get_db),
    master: CurrentUser = Depends(get_current_master),
):
    """Convida jogadores para a luta. Pendentes viram recusa quando o prazo acaba."""
    fight = _get_fight_or_404(db, fight_id)
    invited = fight_services.create_invites(db, fight_id, payload.user_ids, master.user_id, payload.expires_in)

    await _notify(invited, "fight_invite", {"fight_id": fight_id, "name": fight.name, "expires_in": payload.expires_in})
    spawn(_close_invite_window(fight_id, master.user_id, payload.expires_in))
    return {"message": "Invites sent", "expires_in": payload.expires_in, "user_ids": invited}


@router.post("/{fight_id}/respond")
async def respond_invite(
    fight_id: int,
    payload: FightInviteAnswer,
    db: Session = Depends(get_db),
    player: CurrentUser = Depends(get_current_player),
):
    """O jogador responde ao próprio convite (o usuário vem do token, nunca do corpo)."""
    invite = fight_services.answer_invite(db, fight_id, player.user_id, payload.accept)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")

    if invite.invited_by:
        await _notify(
            [invite.invited_by],
            "fight_invite_response",
            {"fight_id": fight_id, "user_id": player.user_id, "accept": payload.accept, "status": invite.status},
        )
    return {"message": "response recorded", "status": invite.status}


@router.get("/{fight_id}/responses", response_model=FightResponses)
def get_responses(fight_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    _require_master_or_participant(db, fight_id, user)
    return fight_services.invite_summary(db, fight_id)


# ========== INÍCIO E TURNOS ==========


@router.put("/{fight_id}/start")
async def start_fight(fight_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    result = fight_services.start_fight(db, fight_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Fight not found")
    fight, participants, turn = result

    await _notify(participants, "fight_started", {"fight_id": fight_id, "name": fight.name, "status": "started"})
    if turn:
        await _notify(
            participants,
            "turn_changed",
            {"fight_id": fight_id, "current_user_id": turn.current_user_id, "current_index": turn.current_index},
        )
    return {"message": "fight started", "participants": participants}


@router.get("/{fight_id}/turn", response_model=FightTurnRead)
def get_turn(fight_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    turn = fight_services.get_turn(db, fight_id)
    if not turn:
        return FightTurnRead(fight_id=fight_id)
    return FightTurnRead(
        fight_id=fight_id, current_user_id=turn.current_user_id, current_index=turn.current_index, phase=turn.phase
    )


@router.get("/{fight_id}/turn/me", response_model=FightTurnRead)
def get_turn_me(fight_id: int, db: Session = Depends(get_db), player: CurrentUser = Depends(get_current_player)):
    _require_master_or_participant(db, fight_id, player)
    turn = fight_services.get_turn(db, fight_id)
    if not turn:
        return FightTurnRead(fight_id=fight_id)
    return FightTurnRead(
        fight_id=fight_id,
        current_user_id=turn.current_user_id,
        current_index=turn.current_index,
        phase=turn.phase,
        is_my_turn=turn.current_user_id == player.user_id,
    )


@router.post("/{fight_id}/turn/advance")
async def advance_turn(fight_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    result = fight_services.advance_turn(db, fight_id)
    if result is None:
        raise HTTPException(status_code=400, detail="No participants to advance")
    turn, participants = result

    await _notify(
        participants,
        "turn_changed",
        {"fight_id": fight_id, "current_user_id": turn.current_user_id, "current_index": turn.current_index},
    )
    return {"message": "turn advanced", "current_user_id": turn.current_user_id, "current_index": turn.current_index}
