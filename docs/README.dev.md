# README

    # chandrashekhar.dev — AI-native portfolio
    Angular 20 · FastAPI · PostgreSQL + pgvector · RAG agent · Knowledge graph · MCP

    ## Quick start
    git clone … && cd portfolio
    cp .env.example .env            # LLM keys, DB url, TURNSTILE_SECRET
    docker compose up -d db redis   # postgres+pgvector, redis
    cd apps/api && uv sync && uv run alembic upgrade head && uv run fastapi dev
    cd apps/worker && uv run python -m ingest     # index content/
    cd apps/web && npm i && npm start              # http://localhost:4200

    ## Structure
    apps/web     Angular SSR site
    apps/api     FastAPI (REST + SSE chat)
    apps/worker  ingestion: parse → chunk → embed → upsert
    apps/mcp     FastMCP server
    content/     source of truth (markdown + json)
    docs/        PRD, Design, Architecture, …

    ## Env
    ANTHROPIC_API_KEY  OPENAI_API_KEY  DATABASE_URL  REDIS_URL
    TURNSTILE_SECRET   RESEND_API_KEY  DAILY_TOKEN_BUDGET
