"""Health checks for the hosting platform and uptime monitors.

- /health and /health/live: "is the process up?" (cheap, no dependencies)
- /health/ready: "can it serve traffic?" (database + Redis reachable); 503 if not
"""

from fastapi import APIRouter, Response, status

from portfolio_api import __version__
from portfolio_api.api.deps import ProbesDep, SettingsDep
from portfolio_api.schemas.health import HealthResponse, ReadinessResponse
from portfolio_api.services.health import run_probes

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
@router.get("/live")
async def liveness(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(status="ok", version=__version__, environment=settings.environment)


@router.get("/ready", responses={503: {"model": ReadinessResponse}})
async def readiness(probes: ProbesDep, response: Response) -> ReadinessResponse:
    checks = await run_probes(probes)
    ready = all(v == "ok" for v in checks.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(status="ok" if ready else "unavailable", checks=checks)
