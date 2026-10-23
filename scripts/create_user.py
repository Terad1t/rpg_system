"""Cria um usuário (Master ou jogador) direto no banco configurado em DATABASE_URL.

Uso:
    uv run python -m scripts.create_user --role master --login mestre
    uv run python -m scripts.create_user --role player --login ana

A senha e o PIN são pedidos no terminal (sem eco). Nada fica salvo em arquivo.
"""

import argparse
import getpass
import sys

from backend.master import models  # noqa: F401  (registra os modelos)
from backend.master.database.connection import Base, SessionLocal, engine
from backend.master.schemas.auth_schema import MasterInitialization, UserCreateByMaster
from backend.master.services.auth_services import UserRuleError, create_master, create_user


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--role", choices=["master", "player"], required=True)
    parser.add_argument("--login", required=True)
    args = parser.parse_args()

    password = getpass.getpass("Senha (mín. 6 caracteres): ")
    pin = getpass.getpass("PIN (4 a 6 dígitos): ")

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        try:
            if args.role == "master":
                user = create_master(db, MasterInitialization(login=args.login, password=password, pin=pin))
            else:
                user = create_user(
                    db,
                    UserCreateByMaster(login=args.login, password=password, pin=pin, role="player"),
                    created_by_id=None,
                )
        except (UserRuleError, ValueError) as exc:
            print(f"Erro: {exc}", file=sys.stderr)
            return 1

    print(f"Usuário criado: id={user.id} login={user.login} role={user.role}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
