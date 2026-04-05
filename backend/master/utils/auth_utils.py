from passlib.context import CryptContext
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

# Configuração de hash de senha usando pbkdf2_sha256 em vez de bcrypt (mais compatível)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Chave secreta para JWT (em produção, usar variável de ambiente)
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui-mude-em-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# ========== FUNÇÕES DE HASH ==========

def hash_password(password: str) -> str:
    """Faz hash da senha usando bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash"""
    return pwd_context.verify(plain_password, hashed_password)

def hash_pin(pin: str) -> str:
    """Faz hash do PIN usando bcrypt"""
    return pwd_context.hash(pin)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verifica se o PIN corresponde ao hash"""
    return pwd_context.verify(plain_pin, hashed_pin)

# ========== FUNÇÕES DE JWT ==========

def create_access_token(user_id: int, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um token JWT com as informações do usuário"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decodifica um token JWT e retorna seus dados"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None or role is None:
            return None
        
        return {"user_id": int(user_id), "role": role}
    except JWTError:
        return None