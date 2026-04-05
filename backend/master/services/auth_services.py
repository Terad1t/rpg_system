from sqlalchemy.orm import Session
from ..models.user_model import User
from ..schemas.auth_schema import UserCreateByMaster, UserUpdateByMaster, LoginRequest
from ..utils.auth_utils import (
    hash_password,
    hash_pin,
    verify_password,
    verify_pin,
    create_access_token
)

# ========== INICIALIZAÇÃO ==========

def initialize_master_if_not_exists(db: Session) -> User:
    """Cria o Master padrão se nenhum Master existir no sistema"""
    existing_master = db.query(User).filter(User.role == "master").first()
    
    if existing_master:
        return existing_master
    
    # Cria o Master inicial com credenciais padrão
    master = User(
        login="master",
        password_hash=hash_password("master123"),
        pin_hash=hash_pin("1234"),
        role="master",
        is_active=True,
        created_by=None
    )
    db.add(master)
    db.commit()
    db.refresh(master)
    
    return master

# ========== AUTENTICAÇÃO ==========

def authenticate_user(db: Session, login_request: LoginRequest) -> User | None:
    """Autentica um usuário verificando login, senha e PIN"""
    user = db.query(User).filter(User.login == login_request.login).first()
    
    if not user or not user.is_active:
        return None
    
    # Verifica senha
    if not verify_password(login_request.password, user.password_hash):
        return None
    
    # Verifica PIN
    if not verify_pin(login_request.pin, user.pin_hash):
        return None
    
    return user

def login(db: Session, login_request: LoginRequest) -> dict | None:
    """Faz o login do usuário e retorna o token JWT"""
    user = authenticate_user(db, login_request)
    
    if not user:
        return None
    
    access_token = create_access_token(user_id=user.id, role=user.role)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }

# ========== GERENCIAMENTO DE USUÁRIOS (MASTER ONLY) ==========

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_login(db: Session, login: str) -> User | None:
    return db.query(User).filter(User.login == login).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()

def count_masters(db: Session) -> int:
    """Conta quantos Masters existem no sistema"""
    return db.query(User).filter(User.role == "master").count()

def create_user(db: Session, user_data: UserCreateByMaster, created_by_id: int) -> User:
    """Cria um novo usuário (deve ser chamado apenas pelo Master)"""
    # Impede criação de mais de um Master
    if user_data.role == "master" and count_masters(db) > 0:
        raise ValueError("Only one Master user is allowed in the system")
    
    new_user = User(
        login=user_data.login,
        password_hash=hash_password(user_data.password),
        pin_hash=hash_pin(user_data.pin),
        role=user_data.role,
        is_active=user_data.is_active,
        created_by=created_by_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def update_user(db: Session, user_id: int, user_update: UserUpdateByMaster) -> User | None:
    """Atualiza dados de um usuário (Master only)"""
    user = get_user_by_id(db, user_id)
    
    if not user:
        return None
    
    # Impede mudança de role de master se já existir outro master
    if user_update.role == "master" and user.role != "master" and count_masters(db) > 0:
        raise ValueError("Only one Master user is allowed in the system")
    
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

def delete_user(db: Session, user_id: int) -> User | None:
    """Deleta um usuário (Master only)"""
    user = get_user_by_id(db, user_id)
    
    if not user:
        return None
    
    db.delete(user)
    db.commit()
    
    return user

def deactivate_user(db: Session, user_id: int) -> User | None:
    """Desativa um usuário em vez de deletá-lo (Master only)"""
    user = get_user_by_id(db, user_id)
    
    if not user:
        return None
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    return user