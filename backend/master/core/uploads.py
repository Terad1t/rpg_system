"""Gravação segura de imagens enviadas por usuários."""

from __future__ import annotations

import secrets

from fastapi import HTTPException, UploadFile, status

from .config import get_settings

CHUNK_SIZE = 64 * 1024


def detect_image_extension(header: bytes) -> str | None:
    """Identifica o formato pelos bytes iniciais (não confia no nome nem no Content-Type)."""
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return ".webp"
    return None


async def save_image_upload(file: UploadFile, subdir: str, prefix: str) -> str:
    """Valida e grava a imagem em `static/uploads/<subdir>/`. Devolve a URL pública (/static/...)."""
    settings = get_settings()
    max_bytes = settings.max_upload_bytes

    data = bytearray()
    while chunk := await file.read(CHUNK_SIZE):
        data.extend(chunk)
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Image too large (max {max_bytes // 1024} KB)",
            )

    extension = detect_image_extension(bytes(data[:16]))
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PNG, JPEG or WebP images are allowed",
        )

    target_dir = settings.uploads_dir / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{secrets.token_hex(12)}{extension}"
    (target_dir / filename).write_bytes(data)
    return f"/static/uploads/{subdir}/{filename}"


def delete_local_upload(public_url: str | None) -> None:
    """Apaga um arquivo antigo, mas só se ele estiver dentro da pasta de uploads."""
    if not public_url or not public_url.startswith("/static/uploads/"):
        return
    settings = get_settings()
    uploads_root = settings.uploads_dir.resolve()
    candidate = (settings.static_dir / public_url.removeprefix("/static/")).resolve()
    if candidate.is_relative_to(uploads_root) and candidate.is_file():
        candidate.unlink(missing_ok=True)


def is_safe_image_reference(value: str) -> bool:
    """Aceita só caminhos locais de upload ou URLs http(s)."""
    return value.startswith("/static/") or value.startswith("https://") or value.startswith("http://")
