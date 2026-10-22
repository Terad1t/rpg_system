"""Canal de atualizações em tempo real (/api/updates/ws).

Os controllers publicam eventos `UpdateEvent` aqui. Trocar a implementação
(ex.: Redis Pub/Sub para vários processos) só exige mudar este módulo.
"""

from .connection_hub import ConnectionHub

broadcast_manager = ConnectionHub()
