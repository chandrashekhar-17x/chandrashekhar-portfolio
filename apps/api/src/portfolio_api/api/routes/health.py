"""Liveness check: answers "is the process up?".

Phase 2 adds /health/ready, which also checks Postgres and Redis.
"""

from fastapi import APIRouter

from portfolio_api import __version__
from portfolio_api.api.deps import SettingsDep
from portfolio_api.schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def liveness(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(status="ok", version=__version__, environment=settings.environment)
