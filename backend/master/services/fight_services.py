from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from ..models.fight_model import Fight
from ..models.fight_entry_model import FightEntry
from ..schemas.fight_schema import FightCreate, FightUpdate, FightEntryCreate


def _refresh_totals(db: Session, fight: Fight) -> Fight:
    entries = db.query(FightEntry).filter(FightEntry.fight_id == fight.id).all()

    fight.total_player_damage = sum((entry.damage or 0) for entry in entries if entry.actor_type == "player")
    fight.total_enemy_damage = sum((entry.damage or 0) for entry in entries if entry.actor_type == "enemy")
    fight.total_player_healing = sum((entry.healing or 0) for entry in entries if entry.actor_type == "player")
    fight.total_enemy_healing = sum((entry.healing or 0) for entry in entries if entry.actor_type == "enemy")
    fight.player_damage_count = sum(1 for entry in entries if entry.actor_type == "player" and (entry.damage or 0) > 0)
    fight.enemy_damage_count = sum(1 for entry in entries if entry.actor_type == "enemy" and (entry.damage or 0) > 0)
    fight.player_healing_count = sum(1 for entry in entries if entry.actor_type == "player" and (entry.healing or 0) > 0)
    fight.enemy_healing_count = sum(1 for entry in entries if entry.actor_type == "enemy" and (entry.healing or 0) > 0)
    return fight


def list_fights(db: Session):
    return db.query(Fight).options(joinedload(Fight.entries)).order_by(Fight.started_at.desc()).all()


def get_fight(db: Session, fight_id: int):
    return db.query(Fight).options(joinedload(Fight.entries)).filter(Fight.id == fight_id).first()


def create_fight(db: Session, payload: FightCreate):
    fight = Fight(
        name=payload.name,
        started_at=payload.started_at or datetime.utcnow(),
        status=payload.status,
        duration_seconds=payload.duration_seconds,
    )
    db.add(fight)
    db.commit()
    db.refresh(fight)
    return fight


def update_fight(db: Session, fight_id: int, payload: FightUpdate):
    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    if not fight:
        return None

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(fight, key, value)

    db.commit()
    db.refresh(fight)
    return fight


def delete_fight(db: Session, fight_id: int):
    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    if not fight:
        return None
    db.delete(fight)
    db.commit()
    return fight


def add_fight_entry(db: Session, fight_id: int, payload: FightEntryCreate):
    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    if not fight:
      return None

    entry = FightEntry(
        fight_id=fight_id,
        actor_type=payload.actor_type,
        actor_name=payload.actor_name,
        damage=payload.damage,
        healing=payload.healing,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    _refresh_totals(db, fight)
    db.commit()
    db.refresh(fight)
    return entry


def delete_fight_entry(db: Session, fight_id: int, entry_id: int):
    entry = db.query(FightEntry).filter(FightEntry.id == entry_id, FightEntry.fight_id == fight_id).first()
    if not entry:
        return None

    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    db.delete(entry)
    db.commit()
    if fight:
        _refresh_totals(db, fight)
        db.commit()
    return entry


def build_fight_stats(db: Session):
    fights = db.query(Fight).options(joinedload(Fight.entries)).order_by(Fight.started_at.asc()).all()

    player_damage_ranking = {}
    enemy_damage_ranking = {}
    player_healing_ranking = {}
    enemy_healing_ranking = {}
    fight_history = []
    evolution = []

    for fight in fights:
        player_damage = 0
        enemy_damage = 0
        player_healing = 0
        enemy_healing = 0

        for entry in fight.entries:
            if entry.actor_type == "player":
                player_damage += entry.damage or 0
                player_healing += entry.healing or 0
                player_damage_ranking[entry.actor_name] = player_damage_ranking.get(entry.actor_name, 0) + (entry.damage or 0)
                player_healing_ranking[entry.actor_name] = player_healing_ranking.get(entry.actor_name, 0) + (entry.healing or 0)
            else:
                enemy_damage += entry.damage or 0
                enemy_healing += entry.healing or 0
                enemy_damage_ranking[entry.actor_name] = enemy_damage_ranking.get(entry.actor_name, 0) + (entry.damage or 0)
                enemy_healing_ranking[entry.actor_name] = enemy_healing_ranking.get(entry.actor_name, 0) + (entry.healing or 0)

        fight_history.append(
            {
                "id": fight.id,
                "name": fight.name,
                "started_at": fight.started_at.isoformat() if fight.started_at else None,
                "ended_at": fight.ended_at.isoformat() if fight.ended_at else None,
                "status": fight.status,
                "duration_seconds": fight.duration_seconds,
                "player_damage": player_damage,
                "enemy_damage": enemy_damage,
                "player_healing": player_healing,
                "enemy_healing": enemy_healing,
                "avg_player_damage": round(player_damage / max(1, fight.player_damage_count or len([e for e in fight.entries if e.actor_type == 'player'])), 2),
                "avg_enemy_damage": round(enemy_damage / max(1, fight.enemy_damage_count or len([e for e in fight.entries if e.actor_type == 'enemy'])), 2),
                "avg_player_healing": round(player_healing / max(1, fight.player_healing_count or len([e for e in fight.entries if e.actor_type == 'player'])), 2),
                "avg_enemy_healing": round(enemy_healing / max(1, fight.enemy_healing_count or len([e for e in fight.entries if e.actor_type == 'enemy'])), 2),
            }
        )
        evolution.append(
            {
                "date": fight.started_at.strftime("%d/%m") if fight.started_at else f"Fight {fight.id}",
                "players": player_damage + player_healing,
                "enemies": enemy_damage + enemy_healing,
            }
        )

    def ranking_to_list(ranking: dict[str, int]):
        return [
            {"name": name, "value": value}
            for name, value in sorted(ranking.items(), key=lambda item: item[1], reverse=True)[:10]
        ]

    return {
        "fight_count": len(fights),
        "total_player_damage": sum(item["player_damage"] for item in fight_history),
        "total_enemy_damage": sum(item["enemy_damage"] for item in fight_history),
        "total_player_healing": sum(item["player_healing"] for item in fight_history),
        "total_enemy_healing": sum(item["enemy_healing"] for item in fight_history),
        "average_session": {
            "player_damage": round(sum(item["player_damage"] for item in fight_history) / max(1, len(fight_history)), 2),
            "enemy_damage": round(sum(item["enemy_damage"] for item in fight_history) / max(1, len(fight_history)), 2),
            "player_healing": round(sum(item["player_healing"] for item in fight_history) / max(1, len(fight_history)), 2),
            "enemy_healing": round(sum(item["enemy_healing"] for item in fight_history) / max(1, len(fight_history)), 2),
        },
        "damage_chart": [
            {"session": item["name"], "players": item["player_damage"], "enemies": item["enemy_damage"]}
            for item in fight_history
        ],
        "healing_chart": [
            {"session": item["name"], "players": item["player_healing"], "enemies": item["enemy_healing"]}
            for item in fight_history
        ],
        "history": fight_history,
        "evolution": evolution,
        "player_ranking": ranking_to_list(player_damage_ranking),
        "enemy_ranking": ranking_to_list(enemy_damage_ranking),
        "player_healing_ranking": ranking_to_list(player_healing_ranking),
        "enemy_healing_ranking": ranking_to_list(enemy_healing_ranking),
        "comparisons": fight_history[-2:] if len(fight_history) >= 2 else fight_history,
    }