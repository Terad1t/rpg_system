from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..utils.auth_dependencies import get_current_master
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
def add_entry(fight_id: int, payload: FightEntryCreate, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    entry = add_fight_entry(db, fight_id, payload)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight not found")
    return entry


@router.delete("/{fight_id}/entries/{entry_id}", response_model=FightEntryRead)
def delete_entry(fight_id: int, entry_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    entry = delete_fight_entry(db, fight_id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Fight entry not found")
    return entry