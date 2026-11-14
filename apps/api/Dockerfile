# API image (Render / Fly / any Docker host). Build from the repo root:
#   docker build -f apps/api/Dockerfile -t portfolio-api .
# The uv workspace needs the root pyproject + lock and every member's metadata.
FROM python:3.13-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PYTHONUNBUFFERED=1 \
    PATH=/app/.venv/bin:$PATH \
    ENVIRONMENT=production \
    CONTENT_DIR=/app/content

WORKDIR /app

# Dependencies first (cached until the lock changes), then the code.
COPY pyproject.toml uv.lock .python-version ./
COPY apps/api/pyproject.toml apps/api/
COPY apps/worker/pyproject.toml apps/worker/
COPY apps/mcp/pyproject.toml apps/mcp/
RUN uv sync --frozen --no-dev --package portfolio-api --no-install-workspace

COPY apps/api apps/api
COPY apps/worker apps/worker
COPY apps/mcp apps/mcp
COPY content content
RUN uv sync --frozen --no-dev --package portfolio-api \
    && useradd --create-home --uid 10001 app

USER app
WORKDIR /app/apps/api
EXPOSE 8000
CMD ["sh", "./docker-entrypoint.sh"]
