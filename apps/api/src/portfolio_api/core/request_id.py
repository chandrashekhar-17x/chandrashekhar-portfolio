"""Middleware: give every request an id, echo it back, and log one line per request.

A client (or a proxy) may send its own `X-Request-ID`; we keep it only if it looks
safe, otherwise we make a new one. The id appears in every log line and in error
responses, so a user's bug report can be matched to the server logs.
"""

import logging
import re
import time
import uuid

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from portfolio_api.core.errors import error_response
from portfolio_api.core.logging import request_id_var

HEADER = "x-request-id"
_SAFE_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")
log = logging.getLogger("portfolio_api.access")


def incoming_id(scope: Scope) -> str:
    for name, value in scope.get("headers", []):
        if name == HEADER.encode():
            candidate = bytes(value).decode("latin-1")
            if _SAFE_ID.match(candidate):
                return candidate
    return uuid.uuid4().hex


class RequestIdMiddleware:
    """Plain ASGI middleware (faster and stream-safe compared to BaseHTTPMiddleware)."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = incoming_id(scope)
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        status = 500
        started_response = False

        async def send_with_id(message: Message) -> None:
            nonlocal status, started_response
            if message["type"] == "http.response.start":
                status = message["status"]
                started_response = True
                message.setdefault("headers", []).append((HEADER.encode(), request_id.encode()))
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        except Exception:
            # Handled here (not in an exception handler) so the 500 still carries
            # the request id: Starlette's own handler runs after this middleware.
            log.exception("unhandled error")
            if not started_response:
                await error_response(500, "Something went wrong. Please try again later.")(
                    scope, receive, send_with_id
                )
        finally:
            log.info(
                "request",
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                },
            )
            request_id_var.reset(token)
