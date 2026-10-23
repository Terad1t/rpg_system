from datetime import UTC, datetime


def utcnow() -> datetime:
    """Data/hora atual em UTC, sem tzinfo.

    O banco guarda datas "naive" em UTC; manter o mesmo formato evita
    comparações entre datas com e sem fuso. Substitui `datetime.utcnow()`,
    que está obsoleto desde o Python 3.12.
    """
    return datetime.now(UTC).replace(tzinfo=None)
