"""One error shape for every failure, so the frontend handles errors in one place:

    {"error": {"code": "NOT_FOUND", "message": "...", "request_id": "..."}}

Unexpected exceptions become a generic 500 in core/request_id.py: details go to the
logs, never to the client.
"""

from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

from portfolio_api.core.logging import request_id_var


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


def _code(status: int) -> str:
    """404 → "NOT_FOUND", 429 → "TOO_MANY_REQUESTS"."""
    try:
        return HTTPStatus(status).name
    except ValueError:
        return "ERROR"


def error_response(status: int, message: str, code: str | None = None) -> JSONResponse:
    error = ErrorBody(code=code or _code(status), message=message, request_id=request_id_var.get())
    body = ErrorResponse(error=error)
    return JSONResponse(status_code=status, content=body.model_dump())


async def _http_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, HTTPException):  # registered for this type only
        raise exc
    response = error_response(exc.status_code, str(exc.detail))
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def _validation_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise exc
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(p) for p in first.get("loc", ()))
    message = f"{where}: {first.get('msg', 'invalid input')}" if where else "Invalid input"
    return error_response(422, message, code="VALIDATION_ERROR")


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
