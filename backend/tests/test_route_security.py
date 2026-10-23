"""Garante que nenhuma rota HTTP fique aberta sem querer.

Se este teste falhar depois de criar uma rota nova, ou a rota precisa de
`Depends(get_current_user/get_current_master/get_current_player)`, ou ela é
pública de propósito e deve entrar em PUBLIC_ROUTES.
"""

import re

import pytest
from fastapi.routing import APIRoute

from backend.master.main import app

from .conftest import auth_header

PUBLIC_ROUTES = {
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/initialize-master"),
    ("GET", "/health"),
}

DOC_PATHS = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


def _concrete_path(path: str) -> str:
    return re.sub(r"\{[^}]+\}", "1", path)


def _api_routes():
    for route in app.routes:
        if not isinstance(route, APIRoute) or route.path in DOC_PATHS:
            continue
        for method in sorted(route.methods - {"HEAD", "OPTIONS"}):
            yield method, route.path


ALL_ROUTES = list(_api_routes())


def test_route_inventory_is_not_empty():
    assert len(ALL_ROUTES) > 50


@pytest.mark.parametrize(("method", "path"), [r for r in ALL_ROUTES if r not in PUBLIC_ROUTES])
def test_route_requires_authentication(client, method, path):
    response = client.request(method, _concrete_path(path))
    assert response.status_code == 401, f"{method} {path} respondeu {response.status_code} sem token"


MASTER_ONLY_PREFIXES = (
    "/api/auth/users",
    "/api/master/",
    "/api/fights/stats",
    "/api/updates/active-users",
)

WORLD_WRITE_PREFIXES = (
    "/api/regions",
    "/api/countries",
    "/api/villages",
    "/api/maps",
    "/api/habilidades",
    "/api/items",
    "/api/racas",
    "/api/classes",
)


def _master_only(method: str, path: str) -> bool:
    if path.startswith(MASTER_ONLY_PREFIXES):
        return True
    return method in {"POST", "PUT", "DELETE"} and path.startswith(WORLD_WRITE_PREFIXES)


@pytest.mark.parametrize(("method", "path"), [r for r in ALL_ROUTES if _master_only(*r)])
def test_master_routes_reject_players(client, player, method, path):
    response = client.request(method, _concrete_path(path), headers=auth_header(player))
    assert response.status_code == 403, f"{method} {path} respondeu {response.status_code} para um jogador"


def test_debug_route_was_removed(client):
    assert client.get("/ws/debug/user-subs").status_code == 404


def test_cors_only_allows_configured_origins(client):
    allowed = client.options(
        "/api/auth/login",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"

    denied = client.options(
        "/api/auth/login",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in denied.headers
