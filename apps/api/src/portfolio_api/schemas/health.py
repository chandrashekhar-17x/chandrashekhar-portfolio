"""Response models for health checks."""

from typing import Literal

from pydantic import BaseModel

from portfolio_api.services.health import Status


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    status: Status
    checks: dict[str, Status]
