from sqlalchemy.orm import Session

from ..models.user_model import User
from ..schemas.auth_schema import LoginRequest, MasterInitialization, UserCreateByMaster, UserUpdateByMaster
from ..utils.auth_utils import create_access_token, hash_password, hash_pin, verify_password, verify_pin


class UserRuleError(ValueError):
    """Regra de negócio de usuários violada (mensagem segura para o cliente)."""


# Hash fixo usado quando o login não existe, para que a resposta leve o mesmo
# tempo de um login existente com senha errada (evita descobrir logins válidos).
_DUMMY_HASH = hash_password("dummy-password-for-timing")


# ========== AUTENTICAÇÃO ==========


def authenticate_user(db: Session, login_request: LoginRequest) -> User | None:
    """Confere login, senha e PIN. Devolve None em qualquer falha."""
    user = get_user_by_login(db, login_request.login)
    if not user:
        verify_password(login_request.password, _DUMMY_HASH)
        return None

    password_ok = verify_password(login_request.password, user.password_hash)
    pin_ok = verify_pin(login_request.pin, user.pin_hash)
    if not (password_ok and pin_ok and user.is_active):
        return None
    return user


def login(db: Session, login_request: LoginRequest) -> dict | None:
    user = authenticate_user(db, login_request)
    if not user:
        return None
    return {
        "access_token": create_access_token(user_id=user.id, role=user.role),
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "login": user.login,
    }


# ========== CONSULTAS ==========


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_login(db: Session, login: str) -> User | None:
    return db.query(User).filter(User.login == login).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).order_by(User.id.asc()).offset(skip).limit(limit).all()


def count_masters(db: Session) -> int:
    return db.query(User).filter(User.role == "master").count()


# ========== ESCRITA ==========


def create_master(db: Session, data: MasterInitialization) -> User:
    if count_masters(db) > 0:
        raise UserRuleError("Master already exists in the system")
    if get_user_by_login(db, data.login):
        raise UserRuleError("Login already exists")

    master = User(
        login=data.login,
        password_hash=hash_password(data.password),
        pin_hash=hash_pin(data.pin),
        role="master",
        is_active=True,
        created_by=None,
    )
    db.add(master)
    db.commit()
    db.refresh(master)
    return master


def create_user(db: Session, user_data: UserCreateByMaster, created_by_id: int) -> User:
    if get_user_by_login(db, user_data.login):
        raise UserRuleError("Login already exists")
    if user_data.role == "master" and count_masters(db) > 0:
        raise UserRuleError("Only one Master user is allowed in the system")

    new_user = User(
        login=user_data.login,
        password_hash=hash_password(user_data.password),
        pin_hash=hash_pin(user_data.pin),
        role=user_data.role,
        is_active=user_data.is_active,
        created_by=created_by_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, user_id: int, user_update: UserUpdateByMaster, acting_user_id: int) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    if user_update.role == "master" and user.role != "master" and count_masters(db) > 0:
        raise UserRuleError("Only one Master user is allowed in the system")
    if user.id == acting_user_id and (user_update.is_active is False or user_update.role == "player"):
        raise UserRuleError("You cannot deactivate or demote your own account")

    if user_update.password:
        user.password_hash = hash_password(user_update.password)
    if user_update.pin:
        user.pin_hash = hash_pin(user_update.pin)
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.role:
        user.role = user_update.role

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int, acting_user_id: int) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if user.id == acting_user_id:
        raise UserRuleError("You cannot delete your own account")
    db.delete(user)
    db.commit()
    return user


def deactivate_user(db: Session, user_id: int, acting_user_id: int) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if user.id == acting_user_id:
        raise UserRuleError("You cannot deactivate your own account")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
