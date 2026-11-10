import json
import logging

from httpx import AsyncClient

from portfolio_api.core.logging import JsonFormatter, request_id_var


async def test_every_response_gets_a_request_id(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert len(response.headers["x-request-id"]) == 32  # uuid4 hex


async def test_a_safe_incoming_id_is_kept_and_an_unsafe_one_replaced(client: AsyncClient) -> None:
    kept = await client.get("/health", headers={"X-Request-ID": "trace-12345678"})
    replaced = await client.get("/health", headers={"X-Request-ID": "bad id\n<script>"})

    assert kept.headers["x-request-id"] == "trace-12345678"
    assert replaced.headers["x-request-id"] != "bad id\n<script>"


def test_log_lines_are_json_with_the_request_id_and_extra_fields() -> None:
    token = request_id_var.set("abc12345")
    try:
        record = logging.makeLogRecord(
            {"name": "t", "levelno": logging.INFO, "levelname": "INFO", "msg": "request"}
        )
        record.status = 200
        line = json.loads(JsonFormatter().format(record))
    finally:
        request_id_var.reset(token)

    assert line["message"] == "request"
    assert line["request_id"] == "abc12345"
    assert line["status"] == 200
    assert line["level"] == "info"
