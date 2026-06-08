from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
import asyncio
from typing import List
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..utils.auth_dependencies import get_current_master, get_current_player
from ..schemas.fight_schema import FightCreate, FightUpdate, FightRead, FightEntryCreate, FightEntryRead
from ..services.fight_services import (
    add_fight_entry,
    build_fight_stats,
    create_fight,
    delete_fight,
    delete_fight_entry,
    get_fight,
    list_fights,
    update_fight,
)
from ..utils.inventory_manager import inventory_manager
from ..models.fight_invite_model import FightInvite
from ..models.fight_participant_model import FightParticipant
from ..models.fight_turn_model import FightTurn
from ..database.connection import SessionLocal
from datetime import datetime, timedelta

# In-memory cache for active participants (filled from DB on invite close/start)
fight_participants: dict[int, List[int]] = {}

router = APIRouter(prefix="/fights", tags=["fights"])


@router.get("/", response_model=list[FightRead])
def read_fights(db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    return list_fights(db)


@router.get("/stats")
def read_fight_stats(db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    return build_fight_stats(db)


@router.get("/{fight_id}", response_model=FightRead)
def read_fight(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    fight = get_fight(db, fight_id)
    if not fight:
        raise HTTPException(status_code=404, detail="Fight not found")
    return fight


@router.post("/", response_model=FightRead, status_code=status.HTTP_201_CREATED)
def create_new_fight(payload: FightCreate, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    return create_fight(db, payload)


@router.put("/{fight_id}", response_model=FightRead)
def update_existing_fight(fight_id: int, payload: FightUpdate, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    fight = update_fight(db, fight_id, payload)
    if not fight:
        raise HTTPException(status_code=404, detail="Fight not found")
    return fight


@router.delete("/{fight_id}")
def delete_existing_fight(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    fight = delete_fight(db, fight_id)
    if not fight:
        raise HTTPException(status_code=404, detail="Fight not found")
    return {"message": "Fight deleted successfully"}


@router.post("/{fight_id}/entries", response_model=FightEntryRead, status_code=status.HTTP_201_CREATED)
async def add_entry(fight_id: int, payload: FightEntryCreate, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    entry = add_fight_entry(db, fight_id, payload)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight not found")
    # Broadcast this fight entry to participants if we have them tracked
    participants = fight_participants.get(fight_id)
    if participants:
        message = {
            "type": "fight_event",
            "fight_id": fight_id,
            "entry": {
                "id": entry.id,
                "actor_character_id": payload.actor_character_id,
                "target_character_id": payload.target_character_id,
                "action": payload.action,
                "value": payload.value,
                "timestamp": entry.created_at.isoformat() if hasattr(entry, 'created_at') else None,
            }
        }
        for user_id in participants:
            # best-effort broadcast
            try:
                asyncio.create_task(inventory_manager.broadcast_to_user(user_id, "fight_event", message))
            except Exception:
                pass

    return entry



@router.post("/{fight_id}/invite")
async def invite_players(fight_id: int, payload: dict, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    """Invite a list of users to the fight. payload: { "user_ids": [1,2], "expires_in": 20 }"""
    user_ids = payload.get("user_ids", [])
    expires_in = int(payload.get("expires_in", 20))

    now = datetime.utcnow()
    # persist invites
    for uid in user_ids:
        inv = FightInvite(
            fight_id=fight_id,
            user_id=uid,
            invited_by=current_master.user_id,
            status="pending",
            created_at=now,
            expires_at=now + timedelta(seconds=expires_in),
        )
        db.add(inv)
    db.commit()

    # send invites
    invite_message = {
        "fight_id": fight_id,
        "name": f"Fight {fight_id}",
        "expires_in": expires_in,
    }
    for uid in user_ids:
        try:
            asyncio.create_task(inventory_manager.broadcast_to_user(uid, "fight_invite", invite_message))
        except Exception:
            pass

    # schedule close of invite window (background task will read DB)
    async def _close_window():
        await asyncio.sleep(expires_in)
        db2 = SessionLocal()
        try:
            invites = db2.query(FightInvite).filter(FightInvite.fight_id == fight_id).all()
            accepted = [inv.user_id for inv in invites if inv.status == "accepted"]
            declined = [inv.user_id for inv in invites if inv.status == "declined" or inv.status == "pending"]

            # mark pending as declined by timeout
            for inv in invites:
                if inv.status == "pending":
                    inv.status = "declined"
                    inv.responded_at = datetime.utcnow()

            db2.commit()

            # cache participants
            fight_participants[fight_id] = accepted

            # notify master with results
            try:
                asyncio.create_task(inventory_manager.broadcast_to_user(current_master.user_id, "fight_invite_results", {
                    "fight_id": fight_id,
                    "accepted": accepted,
                    "declined": declined,
                }))
            except Exception:
                pass
        finally:
            db2.close()

    asyncio.create_task(_close_window())

    return {"message": "Invites sent", "expires_in": expires_in}



@router.post("/{fight_id}/respond")
async def respond_invite(fight_id: int, payload: dict, db: Session = Depends(get_db)):
    """Player responds to an invite: { "user_id": 5, "accept": true }"""
    user_id = payload.get("user_id")
    accept = bool(payload.get("accept", False))

    inv = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found or expired")

    inv.status = "accepted" if accept else "declined"
    inv.responded_at = datetime.utcnow()
    db.commit()

    # notify the master who invited
    try:
        if inv.invited_by:
            await inventory_manager.broadcast_to_user(
                inv.invited_by,
                "fight_invite_response",
                {"fight_id": fight_id, "user_id": user_id, "accept": accept, "status": inv.status},
            )
    except Exception:
        pass

    return {"message": "response recorded"}


@router.get("/{fight_id}/responses")
def get_responses(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    invites = db.query(FightInvite).filter(FightInvite.fight_id == fight_id).all()
    accepted = [inv.user_id for inv in invites if inv.status == "accepted"]
    declined = [inv.user_id for inv in invites if inv.status == "declined"]
    pending = [inv.user_id for inv in invites if inv.status == "pending"]
    return {"fight_id": fight_id, "accepted": accepted, "declined": declined, "pending": pending}


@router.put("/{fight_id}/start")
async def start_fight(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    # mark fight as in_progress and notify accepted participants
    payload = FightUpdate(status="in_progress")
    fight = update_fight(db, fight_id, payload)
    # load accepted participants from DB
    invites = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.status == "accepted").all()
    participants = [inv.user_id for inv in invites]
    fight_participants[fight_id] = participants

    # persist participants as FightParticipant entries (avoid duplicates)
    try:
        for uid in participants:
            # check existing
            exists = db.query(FightParticipant).filter(FightParticipant.fight_id == fight_id, FightParticipant.user_id == uid).first()
            if not exists:
                fp = FightParticipant(fight_id=fight_id, user_id=uid)
                db.add(fp)
        db.commit()
    except Exception:
        db.rollback()
    # initialize turn manager: set first participant as current
    try:
        if participants:
            first_user = participants[0]
            ft = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
            if not ft:
                ft = FightTurn(fight_id=fight_id, current_user_id=first_user, current_index=0, phase='in_progress')
                db.add(ft)
            else:
                ft.current_user_id = first_user
                ft.current_index = 0
                ft.phase = 'in_progress'
            db.commit()
    except Exception:
        db.rollback()

    start_msg = {"fight_id": fight_id, "status": "started"}
    for uid in participants:
        try:
            asyncio.create_task(inventory_manager.broadcast_to_user(uid, "fight_started", start_msg))
        except Exception:
            pass

    # broadcast turn_changed
    try:
        turn = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
        if turn:
            turn_msg = {"fight_id": fight_id, "current_user_id": turn.current_user_id, "current_index": turn.current_index}
            for uid in participants:
                try:
                    asyncio.create_task(inventory_manager.broadcast_to_user(uid, 'turn_changed', turn_msg))
                except Exception:
                    pass
    except Exception:
        pass

    return {"message": "fight started", "participants": participants}
    return entry


@router.delete("/{fight_id}/entries/{entry_id}", response_model=FightEntryRead)
def delete_entry(fight_id: int, entry_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    entry = delete_fight_entry(db, fight_id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight entry not found")
    return entry


@router.post("/{fight_id}/entries/player", status_code=status.HTTP_201_CREATED)
async def player_add_entry(fight_id: int, payload: dict, db: Session = Depends(get_db), current_player=Depends(get_current_player)):
    """Player submits a simple action/entry to the fight. payload is flexible but should contain actor_name, actor_type, damage/healing or action/value."""
    # authorization: fight must exist
    fight = get_fight(db, fight_id)
    if not fight:
        raise HTTPException(status_code=404, detail="Fight not found")

    # check participant or accepted invite
    is_participant = db.query(FightParticipant).filter(FightParticipant.fight_id == fight_id, FightParticipant.user_id == current_player.user_id).first() is not None
    has_accepted_invite = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.user_id == current_player.user_id, FightInvite.status == 'accepted').first() is not None
    if not (is_participant or has_accepted_invite):
        raise HTTPException(status_code=403, detail="You are not a participant of this fight")

    # validate action/value
    allowed_actions = {'attack', 'heal', 'defend', 'skill', 'ready'}
    action_val = (payload.get('action') or '').strip().lower() if payload.get('action') else None
    if action_val and action_val not in allowed_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action_val}'")

    # cap numeric value
    try:
        raw_value = int(payload.get('value', payload.get('damage', 0) or 0))
    except Exception:
        raw_value = 0
    value = max(0, min(raw_value, 100000))

    # allow 'ready' even if fight not started; other actions require in_progress
    if action_val and action_val != 'ready' and (fight.status or '').lower() != 'in_progress':
        raise HTTPException(status_code=400, detail='Fight not in progress')

    # attempt to persist via service if available
    try:
        # normalize into FightEntryCreate shape when possible
        entry_payload = FightEntryCreate(
            actor_type=payload.get('actor_type', 'player'),
            actor_name=payload.get('actor_name', current_player.login if hasattr(current_player, 'login') else f'user:{current_player.user_id}'),
            damage=value if action_val == 'attack' else int(payload.get('damage', 0) or 0),
            healing=value if action_val == 'heal' else int(payload.get('healing', 0) or 0),
            action=action_val,
            value=value,
            card_id=payload.get('card_id'),
        )
    except Exception:
        # fallback: create minimal payload
        entry_payload = FightEntryCreate(actor_type='player', actor_name=str(payload.get('actor_name', 'player')), damage=0, healing=0)

    entry = add_fight_entry(db, fight_id, entry_payload)

    # turn enforcement: if fight is in progress and action is not 'ready', ensure it is player's turn
    try:
        if (fight.status or '').lower() == 'in_progress' and action_val and action_val != 'ready':
            ft = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
            if ft and ft.current_user_id and ft.current_user_id != current_player.user_id:
                # rollback entry removal if necessary (best-effort)
                # Note: add_fight_entry already committed; we won't delete here but inform the caller
                raise HTTPException(status_code=403, detail='Not your turn')
    except HTTPException:
        raise
    except Exception:
        pass

    # broadcast to known participants (best-effort)
    participants = fight_participants.get(fight_id)
    message = {
        'type': 'fight_event',
        'fight_id': fight_id,
        'entry': {
            'id': getattr(entry, 'id', None),
            'actor_character_id': payload.get('actor_character_id'),
            'target_character_id': payload.get('target_character_id'),
            'action': entry.action if entry is not None and hasattr(entry, 'action') else payload.get('action'),
            'value': entry.value if entry is not None and hasattr(entry, 'value') else payload.get('value', payload.get('damage')),
            'card_id': entry.card_id if entry is not None and hasattr(entry, 'card_id') else payload.get('card_id'),
            'timestamp': getattr(entry, 'created_at', None).isoformat() if getattr(entry, 'created_at', None) else None,
        }
    }
    if participants:
        for user_id in participants:
            try:
                asyncio.create_task(inventory_manager.broadcast_to_user(user_id, 'fight_event', message))
            except Exception:
                pass

    # always broadcast to the submitting player as well
    try:
        asyncio.create_task(inventory_manager.broadcast_to_user(current_player.user_id, 'fight_event', message))
    except Exception:
        pass

    return {'message': 'entry recorded', 'entry_id': getattr(entry, 'id', None)}



@router.get("/{fight_id}/turn")
def get_turn(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    ft = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
    if not ft:
        return {"fight_id": fight_id, "current_user_id": None, "current_index": None, "phase": None}
    return {"fight_id": fight_id, "current_user_id": ft.current_user_id, "current_index": ft.current_index, "phase": ft.phase}


@router.get("/{fight_id}/turn/me")
def get_turn_me(fight_id: int, db: Session = Depends(get_db), current_player=Depends(get_current_player)):
    ft = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
    if not ft:
        return {"fight_id": fight_id, "current_user_id": None, "is_my_turn": False}
    return {"fight_id": fight_id, "current_user_id": ft.current_user_id, "is_my_turn": (ft.current_user_id == current_player.user_id)}


@router.post("/{fight_id}/turn/advance")
def advance_turn(fight_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    # advance to the next participant in the fight
    invites = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.status == 'accepted').all()
    participants = [inv.user_id for inv in invites]
    if not participants:
        raise HTTPException(status_code=400, detail='No participants to advance')

    ft = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
    if not ft:
        ft = FightTurn(fight_id=fight_id, current_index=0, current_user_id=participants[0], phase='in_progress')
        db.add(ft)
        db.commit()
    else:
        next_index = (ft.current_index + 1) % len(participants)
        ft.current_index = next_index
        ft.current_user_id = participants[next_index]
        ft.phase = 'in_progress'
        db.commit()

    # broadcast turn change
    turn_msg = {"fight_id": fight_id, "current_user_id": ft.current_user_id, "current_index": ft.current_index}
    for uid in participants:
        try:
            asyncio.create_task(inventory_manager.broadcast_to_user(uid, 'turn_changed', turn_msg))
        except Exception:
            pass

    return {"message": 'turn advanced', "current_user_id": ft.current_user_id, "current_index": ft.current_index}