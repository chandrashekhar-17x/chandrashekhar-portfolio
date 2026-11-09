# Developer README

The root [README.md](../README.md) has the quick start. This page covers day-to-day details.

## Toolchain

| Tool     | Version          | Notes                                                      |
| -------- | ---------------- | ---------------------------------------------------------- |
| Node     | ≥ 22.22.3 (`.nvmrc`) | Angular 22 minimum                                     |
| pnpm     | 10.34 (`packageManager`) | install scripts blocked by default (`allowBuilds`) |
| uv       | ≥ 0.13           | manages Python 3.13 (`.python-version`), one `.venv` + `uv.lock` |
| Docker   | Compose v2       | services in `infra/docker-compose.yml`                     |

## Local services

| Service  | Host address      | Notes                                   |
| -------- | ----------------- | --------------------------------------- |
| Postgres | `localhost:5433`  | user/pass/db `portfolio`; pgvector + pg_trgm enabled |
| Redis    | `localhost:6380`  | AOF on, 128 MB LRU                      |
| Ollama   | `localhost:11434` | only with `make up-ai`                  |

Ports are 5433/6380 (not the defaults) to avoid clashing with locally installed services.
Change them in `.env`. Reset all data: `docker compose -f infra/docker-compose.yml down -v`.

## Python workspace

`apps/api`, `apps/worker` and `apps/mcp` are packages in one uv workspace
(`portfolio_api`, `portfolio_worker`, `portfolio_mcp`). Worker and MCP depend on the API package
so they reuse its models and services. Add a dependency to one app:

```bash
uv add --package portfolio-api sqlalchemy
```

## Env

Copy `.env.example` → `.env`. Every variable is listed there, grouped by the phase that needs it.
Empty values mean "not set".
