# Plan

Phases follow `docs/IMPLEMENTATION_PROMPT.md` (the master brief). Each phase ships something
**and** teaches one new backend/AI skill. A phase starts with an approved plan and ends with a
report + manual test checklist; the next phase starts only after "next".

| Phase                        | Ship                                                                                        | You learn                               | Status  |
| ---------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- | ------- |
| 0 · Foundation               | Monorepo, Docker services, CI, pre-commit, design tokens, content/ seed + validator         | uv, GitHub Actions, repo hygiene        | ✅ done |
| 1 · Frontend foundation      | Angular SSR site, all sections with @defer, graph, cursor/splash, ⌘K, routes, SEO, a11y, e2e | SSR, @defer, canvas perf, Playwright    | next    |
| 2 · Backend core + DB        | FastAPI layers, all tables, Alembic, seed, public APIs, contact, logging; web uses the API  | FastAPI, SQLAlchemy 2, Alembic, pytest  |         |
| 3 · Admin panel              | Secure auth (argon2, JWT cookies, CSRF, 2FA), /admin CRUD, uploads, cache invalidation      | Auth & security, object storage         |         |
| 4 · RAG agent                | Ingestion, hybrid retrieval, provider abstraction, SSE /chat, guardrails, budget, evals     | Embeddings, chunking, prompting, evals  |         |
| 5 · Graph-grounded + recruiter | Graph-hop retrieval, LangGraph router, /match JD report, /graph page                      | Hybrid retrieval, LangGraph             |         |
| 6 · AI Lab + voice           | /lab live status, voice "Jarvis" (Web Speech → realtime behind a flag)                      | STT/TTS, realtime APIs                  |         |
| 7 · MCP + discoverability    | FastMCP server (tools + resources), /llms.txt, /llms-full.txt                               | MCP                                     |         |
| 8 · Showcase extras          | CAD / PDF / 100k-grid demos, journal, GitHub widget, guestbook, analytics, OG images        | Perf at scale, content pipelines        |         |
| 9 · Security, perf, launch   | ASVS L1, CSP nonces, ZAP, k6, Sentry, backups, prod deploy, custom domain, RUNBOOK          | Ops, observability, hardening           |         |
