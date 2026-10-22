"""Configuração central da aplicação, lida de variáveis de ambiente.

Em desenvolvimento, um arquivo `.env` na raiz do repositório é carregado
automaticamente (sem sobrescrever variáveis já definidas no ambiente).
Veja `.env.example` para a lista completa.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = REPO_ROOT / "backend" / "master"


def _load_dotenv(path: Path) -> None:
    """Carrega `CHAVE=valor` de um arquivo `.env` sem sobrescrever o ambiente."""
    if not path.exists():
        return
    # `utf-8-sig` remove o BOM que o PowerShell costuma gravar.
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    secret_key: str
    database_url: str
    cors_origins: list[str] = field(default_factory=list)
    access_token_expire_minutes: int = 480
    master_bootstrap_token: str | None = None
    static_dir: Path = BACKEND_DIR / "static"
    max_upload_bytes: int = 2 * 1024 * 1024
    login_max_attempts: int = 5
    login_window_seconds: int = 300
    effects_interval_seconds: int = 5

    @property
    def uploads_dir(self) -> Path:
        return self.static_dir / "uploads"


@lru_cache
def get_settings() -> Settings:
    _load_dotenv(REPO_ROOT / ".env")

    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError(
            "A variável SECRET_KEY é obrigatória. Copie `.env.example` para `.env` "
            'e defina um valor aleatório (ex.: `python -c "import secrets; print(secrets.token_urlsafe(48))"`).'
        )

    default_db = f"sqlite:///{(REPO_ROOT / 'rpg_system.db').as_posix()}"

    return Settings(
        secret_key=secret_key,
        database_url=os.getenv("DATABASE_URL", default_db),
        cors_origins=_split_csv(os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")),
        master_bootstrap_token=os.getenv("MASTER_BOOTSTRAP_TOKEN") or None,
        static_dir=Path(os.getenv("STATIC_DIR", str(BACKEND_DIR / "static"))),
        max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(2 * 1024 * 1024))),
        login_max_attempts=int(os.getenv("LOGIN_MAX_ATTEMPTS", "5")),
        login_window_seconds=int(os.getenv("LOGIN_WINDOW_SECONDS", "300")),
        effects_interval_seconds=int(os.getenv("EFFECTS_INTERVAL_SECONDS", "5")),
    )
