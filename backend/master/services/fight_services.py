from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session, joinedload

from ..core.time import utcnow
from ..models.fight_entry_model import FightEntry
from ..models.fight_invite_model import FightInvite
from ..models.fight_model import Fight
from ..models.fight_participant_model import FightParticipant
from ..models.fight_turn_model import FightTurn
from ..schemas.fight_schema import FightCreate, FightEntryCreate, FightUpdate


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
        started_at=payload.started_at or utcnow(),
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
        action=getattr(payload, "action", None),
        value=getattr(payload, "value", None) or 0,
        card_id=getattr(payload, "card_id", None),
    )
    db.add(entry)
    db.flush()
    _refresh_totals(db, fight)
    db.commit()
    db.refresh(entry)
    return entry


def delete_fight_entry(db: Session, fight_id: int, entry_id: int):
    entry = db.query(FightEntry).filter(FightEntry.id == entry_id, FightEntry.fight_id == fight_id).first()
    if not entry:
        return None

    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    db.delete(entry)
    db.flush()
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
                "avg_player_damage": round(
                    player_damage
                    / max(1, fight.player_damage_count or len([e for e in fight.entries if e.actor_type == "player"])),
                    2,
                ),
                "avg_enemy_damage": round(
                    enemy_damage / max(1, fight.enemy_damage_count or len([e for e in fight.entries if e.actor_type == "enemy"])),
                    2,
                ),
                "avg_player_healing": round(
                    player_healing
                    / max(1, fight.player_healing_count or len([e for e in fight.entries if e.actor_type == "player"])),
                    2,
                ),
                "avg_enemy_healing": round(
                    enemy_healing
                    / max(1, fight.enemy_healing_count or len([e for e in fight.entries if e.actor_type == "enemy"])),
                    2,
                ),
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
            {"name": name, "value": value} for name, value in sorted(ranking.items(), key=lambda item: item[1], reverse=True)[:10]
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
            {"session": item["name"], "players": item["player_damage"], "enemies": item["enemy_damage"]} for item in fight_history
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


# ========== CONVITES, PARTICIPANTES E TURNOS ==========


def create_invites(db: Session, fight_id: int, user_ids: list[int], invited_by: int, expires_in: int) -> list[int]:
    """Cria (ou renova) convites pendentes. Devolve os user_ids convidados, sem repetição."""
    now = utcnow()
    unique_ids = list(dict.fromkeys(user_ids))
    for user_id in unique_ids:
        invite = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.user_id == user_id).first()
        if invite is None:
            invite = FightInvite(fight_id=fight_id, user_id=user_id)
            db.add(invite)
        invite.invited_by = invited_by
        invite.status = "pending"
        invite.created_at = now
        invite.responded_at = None
        invite.expires_at = now + timedelta(seconds=expires_in)
    db.commit()
    return unique_ids


def answer_invite(db: Session, fight_id: int, user_id: int, accept: bool) -> FightInvite | None:
    """Registra a resposta do próprio jogador. Só vale para convite pendente e dentro do prazo."""
    invite = db.query(FightInvite).filter(FightInvite.fight_id == fight_id, FightInvite.user_id == user_id).first()
    if invite is None or invite.status != "pending":
        return None
    if invite.expires_at and invite.expires_at < utcnow():
        return None
    invite.status = "accepted" if accept else "declined"
    invite.responded_at = utcnow()
    db.commit()
    return invite


def close_invite_window(db: Session, fight_id: int) -> dict:
    """Recusa por tempo os convites ainda pendentes e devolve o resumo."""
    invites = db.query(FightInvite).filter(FightInvite.fight_id == fight_id).all()
    now = utcnow()
    for invite in invites:
        if invite.status == "pending":
            invite.status = "declined"
            invite.responded_at = now
    db.commit()
    return {
        "fight_id": fight_id,
        "accepted": [inv.user_id for inv in invites if inv.status == "accepted"],
        "declined": [inv.user_id for inv in invites if inv.status == "declined"],
    }


def invite_summary(db: Session, fight_id: int) -> dict:
    """Status de cada jogador convidado. Com convites repetidos (bancos antigos), vale o mais recente."""
    invites = db.query(FightInvite).filter(FightInvite.fight_id == fight_id).order_by(FightInvite.id.asc()).all()
    latest = {invite.user_id: invite.status for invite in invites}
    by_status: dict[str, list[int]] = {"accepted": [], "declined": [], "pending": []}
    for user_id, invite_status in latest.items():
        by_status.setdefault(invite_status, []).append(user_id)
    return {"fight_id": fight_id, **{key: by_status[key] for key in ("accepted", "declined", "pending")}}


def participant_ids(db: Session, fight_id: int) -> list[int]:
    """Jogadores que aceitaram o convite, na ordem do convite (define a ordem dos turnos)."""
    invites = (
        db.query(FightInvite)
        .filter(FightInvite.fight_id == fight_id, FightInvite.status == "accepted")
        .order_by(FightInvite.id.asc())
        .all()
    )
    return list(dict.fromkeys(invite.user_id for invite in invites))


def is_participant(db: Session, fight_id: int, user_id: int) -> bool:
    if user_id in participant_ids(db, fight_id):
        return True
    return (
        db.query(FightParticipant).filter(FightParticipant.fight_id == fight_id, FightParticipant.user_id == user_id).first()
        is not None
    )


def start_fight(db: Session, fight_id: int) -> tuple[Fight, list[int], FightTurn | None] | None:
    fight = db.query(Fight).filter(Fight.id == fight_id).first()
    if not fight:
        return None

    fight.status = "in_progress"
    participants = participant_ids(db, fight_id)

    existing = {row.user_id for row in db.query(FightParticipant).filter(FightParticipant.fight_id == fight_id).all()}
    for user_id in participants:
        if user_id not in existing:
            db.add(FightParticipant(fight_id=fight_id, user_id=user_id))

    turn = db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()
    if participants:
        if turn is None:
            turn = FightTurn(fight_id=fight_id)
            db.add(turn)
        turn.current_user_id = participants[0]
        turn.current_index = 0
        turn.phase = "in_progress"

    db.commit()
    db.refresh(fight)
    return fight, participants, turn


def get_turn(db: Session, fight_id: int) -> FightTurn | None:
    return db.query(FightTurn).filter(FightTurn.fight_id == fight_id).first()


def advance_turn(db: Session, fight_id: int) -> tuple[FightTurn, list[int]] | None:
    participants = participant_ids(db, fight_id)
    if not participants:
        return None

    turn = get_turn(db, fight_id)
    if turn is None:
        turn = FightTurn(fight_id=fight_id, current_index=0, current_user_id=participants[0], phase="in_progress")
        db.add(turn)
    else:
        next_index = ((turn.current_index or 0) + 1) % len(participants)
        turn.current_index = next_index
        turn.current_user_id = participants[next_index]
        turn.phase = "in_progress"
    db.commit()
    db.refresh(turn)
    return turn, participants
