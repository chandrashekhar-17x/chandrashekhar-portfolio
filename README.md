# Chandrashekhar: AI-native portfolio

Angular 22 · FastAPI · PostgreSQL + pgvector · Redis · RAG agent · Knowledge graph · MCP

> Frontend engineer who builds complex UIs (CAD/DXF viewers, PDF engines, data-extraction tools), now building
> the AI systems behind them.

A portfolio being built into a working AI system: ask a question, the answer streams in, and the
knowledge-graph nodes it cites light up. Status: **Phase 1 frontend implemented; maintenance verification in progress.** Chat is scripted; the backend currently exposes `/health`. Database APIs and real RAG are planned. See [docs/plan.md](docs/plan.md).

## Repository layout

| Path          | What                                                                  |
| ------------- | --------------------------------------------------------------------- |
| `apps/web`    | Angular SSR site (standalone, signals, zoneless)                      |
| `apps/api`    | FastAPI backend (`portfolio_api`): REST + SSE chat                    |
| `apps/worker` | Ingestion worker (`portfolio_worker`): parse → chunk → embed → upsert |
| `apps/mcp`    | MCP server (`portfolio_mcp`) for AI agents                            |
| `content/`    | Seed content (JSON + Markdown) and its JSON Schemas                   |
| `infra/`      | Docker Compose for Postgres/pgvector, Redis, Ollama                   |
| `scripts/`    | Repo tooling (content validator)                                      |
| `docs/`       | PRD, design, architecture, API, plan, backlog …                       |
| `prototype/`  | Single-file HTML prototype: visual reference only                     |

## Quick start

Requirements: Node ≥ 22.22.3 + pnpm 10, [uv](https://docs.astral.sh/uv/) (installs Python 3.13), Docker.

```bash
make setup      # pnpm + uv installs, git hooks, creates .env from .env.example
make up         # Postgres (localhost:5433) + Redis (localhost:6380)
make dev-api    # http://localhost:8000/docs
make dev-web    # http://localhost:4200
make check      # lint, types, content, tests, build, SSR and e2e
```

Run `make visual` and `make lighthouse` for the separate screenshot and performance gates.
Run `make` to list every task. Contribution rules and branch protection: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

Code: [MIT](LICENSE). Content in `content/` (text, photos, resume): © Chandrashekhar, all rights reserved.
