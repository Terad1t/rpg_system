import asyncio
import logging
from collections.abc import Coroutine

logger = logging.getLogger(__name__)

# O event loop guarda só referências fracas às tasks; sem esta lista, uma task
# em segundo plano pode ser coletada pelo GC antes de terminar.
_background_tasks: set[asyncio.Task] = set()


def _on_done(task: asyncio.Task) -> None:
    _background_tasks.discard(task)
    if not task.cancelled() and task.exception() is not None:
        logger.error("Background task failed", exc_info=task.exception())


def spawn(coro: Coroutine) -> asyncio.Task:
    task = asyncio.create_task(coro)
    _background_tasks.add(task)
    task.add_done_callback(_on_done)
    return task


async def cancel_all() -> None:
    for task in list(_background_tasks):
        task.cancel()
    await asyncio.gather(*_background_tasks, return_exceptions=True)
