from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    UserCreateByMaster,
    UserRead,
    UserUpdateByMaster,
    MasterInitialization
)
from services.auth_services import (
    login,
    create_user,
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,
    deactivate_user,
    initialize_master_if_not_exists,
    get_user_by_login,
)
from utils.auth_dependencies import get_current_user, get_current_master, CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])

# ========== INICIALIZAÇÃO ==========

@router.post("/initialize-master", response_model=UserRead)
def initialize_master(master_data: MasterInitialization, db: Session = Depends(get_db)):
    """
    Inicializa o Master do sistema se nenhum Master existir.
    Essa rota só funciona se o banco estiver vazio de Masters.
    """
    from services.auth_services import hash_password, hash_pin
    from models.user_model import User
    
    # Verifica se já existe um Master
    existing_master = db.query(User).filter(User.role == "master").first()
    
    if existing_master:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master already exists in the system"
        )
    
    # Cria o novo Master
    new_master = User(
        login=master_data.login,
        password_hash=hash_password(master_data.password),
        pin_hash=hash_pin(master_data.pin),
        role="master",
        is_active=True,
        created_by=None
    )
    
    db.add(new_master)
    db.commit()
    db.refresh(new_master)
    
    return new_master

# ========== LOGIN ==========

@router.post("/login", response_model=TokenResponse)
def login_endpoint(login_request: LoginRequest, db: Session = Depends(get_db)):
    """Faz o login do usuário com login, senha e PIN"""
    result = login(db, login_request)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials"
        )
    
    return result

# ========== GERENCIAMENTO DE USUÁRIOS (MASTER ONLY) ==========

@router.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Lista todos os usuários do sistema (Master only)"""
    users = get_all_users(db, skip=skip, limit=limit)
    return users

@router.get("/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Obém um usuário específico (Master only)"""
    user = get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/users", response_model=UserRead)
def create_new_user(
    user_data: UserCreateByMaster,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Cria um novo usuário (Master only)"""
    # Verifica se o login já existe
    existing_user = get_user_by_login(db, user_data.login)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login already exists"
        )
    
    try:
        new_user = create_user(db, user_data, current_master.user_id)
        return new_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/users/{user_id}", response_model=UserRead)
def update_existing_user(
    user_id: int,
    user_update: UserUpdateByMaster,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Atualiza um usuário (Master only)"""
    user = update_user(db, user_id, user_update)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.delete("/users/{user_id}")
def delete_existing_user(
    user_id: int,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Deleta um usuário (Master only)"""
    user = delete_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/deactivate")
def deactivate_existing_user(
    user_id: int,
    current_master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db)
):
    """Desativa um usuário sem deletá-lo (Master only)"""
    user = deactivate_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deactivated successfully"}

# ========== PERFIL DO USUÁRIO ==========

@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtém o perfil do usuário autenticado"""
    user = get_user_by_id(db, current_user.user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user