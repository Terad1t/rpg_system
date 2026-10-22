import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..core.rate_limit import SlidingWindowLimiter
from ..database.connection import get_db
from ..schemas.auth_schema import (
    LoginRequest,
    MasterInitialization,
    TokenResponse,
    UserCreateByMaster,
    UserRead,
    UserUpdateByMaster,
)
from ..services import auth_services
from ..services.auth_services import UserRuleError
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

_settings = get_settings()
login_limiter = SlidingWindowLimiter(_settings.login_max_attempts, _settings.login_window_seconds)


def _rule_error(exc: UserRuleError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


def _user_or_404(user):
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ========== INICIALIZAÇÃO ==========


@router.post("/initialize-master", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def initialize_master(
    master_data: MasterInitialization,
    bootstrap_token: str = Header(..., alias="X-Master-Bootstrap-Token"),
    db: Session = Depends(get_db),
):
    """Cria o Master inicial. Exige o header com o valor de MASTER_BOOTSTRAP_TOKEN."""
    expected = get_settings().master_bootstrap_token
    if not expected:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Master bootstrap is not configured")
    if not secrets.compare_digest(bootstrap_token, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")
    try:
        return auth_services.create_master(db, master_data)
    except UserRuleError as exc:
        raise _rule_error(exc) from exc


# ========== LOGIN ==========


@router.post("/login", response_model=TokenResponse)
def login_endpoint(login_request: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login com usuário, senha e PIN. Bloqueia temporariamente após várias falhas."""
    client_ip = request.client.host if request.client else "unknown"
    limiter_key = f"{client_ip}:{login_request.login.lower()}"

    retry_after = login_limiter.retry_after(limiter_key)
    if retry_after:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    result = auth_services.login(db, login_request)
    if not result:
        login_limiter.register_failure(limiter_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid login credentials")

    login_limiter.reset(limiter_key)
    return result


# ========== GERENCIAMENTO DE USUÁRIOS (MASTER) ==========


@router.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 100,
    _master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    return auth_services.get_all_users(db, skip=skip, limit=min(limit, 500))


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, _master: CurrentUser = Depends(get_current_master), db: Session = Depends(get_db)):
    return _user_or_404(auth_services.get_user_by_id(db, user_id))


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_data: UserCreateByMaster,
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    try:
        return auth_services.create_user(db, user_data, master.user_id)
    except UserRuleError as exc:
        raise _rule_error(exc) from exc


@router.put("/users/{user_id}", response_model=UserRead)
def update_existing_user(
    user_id: int,
    user_update: UserUpdateByMaster,
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    try:
        return _user_or_404(auth_services.update_user(db, user_id, user_update, master.user_id))
    except UserRuleError as exc:
        raise _rule_error(exc) from exc


@router.delete("/users/{user_id}")
def delete_existing_user(user_id: int, master: CurrentUser = Depends(get_current_master), db: Session = Depends(get_db)):
    try:
        _user_or_404(auth_services.delete_user(db, user_id, master.user_id))
    except UserRuleError as exc:
        raise _rule_error(exc) from exc
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/deactivate")
def deactivate_existing_user(user_id: int, master: CurrentUser = Depends(get_current_master), db: Session = Depends(get_db)):
    try:
        _user_or_404(auth_services.deactivate_user(db, user_id, master.user_id))
    except UserRuleError as exc:
        raise _rule_error(exc) from exc
    return {"message": "User deactivated successfully"}


# ========== PERFIL ==========


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_or_404(auth_services.get_user_by_id(db, current_user.user_id))
