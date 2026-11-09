# Architecture

## Frontend — Angular 20+

- **Standalone components + signals**, zoneless change detection, `OnPush` everywhere.
- **SSR + incremental hydration** (`@defer (hydrate on viewport)`) — fast first paint, SEO.
- **Lazy loading:** route-level `loadComponent`; heavy widgets (graph, Three.js, chat) in `@defer (on viewport | on interaction)` blocks.
- **Heavy libs** imported dynamically: `three`, `force-graph`/`d3-force`, `gsap`. Run render loops with `ngZone.runOutsideAngular` (if not zoneless).
- **State:** signals + a small `ChatStore` service; `httpResource`/HttpClient with interceptors (request-id, error toast).
- **Streaming:** `fetch` + ReadableStream for SSE chat tokens.
- **Styling:** SCSS + CSS custom properties (tokens), container queries; PrimeNG only for admin tables (you know it well).

&nbsp;

    apps/web/src/app/
      core/        # interceptors, theme, seo, analytics
      shared/ui/   # button, card, chip, tilt.directive, magnetic.directive, cursor
      features/
        home/  graph/  work/  lab/  chat/  journal/  contact/
      admin/       # lazy, guarded

## Backend — FastAPI

    apps/api/app/
      main.py           # app factory, middleware
      api/v1/           # routers: content, graph, chat, contact, admin
      core/             # config (pydantic-settings), security, rate_limit
      db/               # SQLAlchemy 2.0 async models, Alembic migrations
      services/         # retrieval.py, llm.py, guardrails.py, graph.py
      agents/           # router + tools (LangGraph later)
      schemas/          # pydantic request/response models

- Async everywhere (asyncpg), dependency-injected DB session, structured JSON logs.
- LLM provider abstraction (`LLMClient` protocol) → swap Claude / OpenAI / Groq / Ollama by env.
- OpenAPI at `/docs` — doubles as API.md source.

## Extra

- **Worker** (same Python package) for ingestion & re-embedding; trigger via admin or CI on content change.
- **MCP server** (FastMCP) reuses `services/retrieval.py`.
- **Security:** CSP, HSTS, CORS allow-list, Turnstile, Redis rate-limit, secrets only in env, admin behind JWT + IP allow-list.
