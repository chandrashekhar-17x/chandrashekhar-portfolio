"""Structured JSON logs, one object per line, each tagged with the request id.

Why JSON: log platforms (and `jq` locally) can filter on fields such as
`request_id` or `status` instead of grepping free text.
"""

import json
import logging
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

# The id of the request being handled. A ContextVar is like a global that is
# separate for every concurrent request, so async code never mixes them up.
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

# Standard LogRecord attributes; anything else passed via `extra=` is a field.
_RESERVED = set(vars(logging.makeLogRecord({}))) | {"message", "asctime"}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }
        if request_id := request_id_var.get():
            entry["request_id"] = request_id
        entry.update({k: v for k, v in vars(record).items() if k not in _RESERVED})
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, default=str)


def configure_logging(level: str = "INFO") -> None:
    """Route the root logger (and uvicorn's) through the JSON formatter."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
    # Our middleware logs every request; uvicorn's access log would duplicate it.
    logging.getLogger("uvicorn.access").disabled = True
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
