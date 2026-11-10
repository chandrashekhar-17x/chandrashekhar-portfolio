You are my senior full-stack + AI engineer and tech lead. We are building my real, public, production-grade portfolio from scratch, step by step, in this repository.

## 0. Read first (do not skip)
Read CLAUDE.md, docs/conversation-log.md, and the current planning files in docs/ (PRD, Design, Architecture, architecture-sequence, database, API, agents, mcp, integration, features, plan, testing, debuging, review, backlog). Treat prototype/index.html ONLY as a visual and behaviour reference (look, motion, layout, the graph, the splash cursor, lazy loading). Do NOT ship a single HTML file. Rebuild everything properly as a real application.

## 1. Goal
A fully dynamic, secure, fast, accessible, SEO-friendly portfolio that is public on the internet. It must look and work like a professional product, not a college project:
- Frontend: Angular (latest stable), standalone components, signals, zoneless, SSR + incremental hydration, @defer per section, lazy routes, SCSS design tokens, dark/light themes, all animations from the prototype (hero canvas, knowledge graph, tilt cards, magnetic buttons, text effects, native cursor, command palette).
- Backend: Python FastAPI (async), SQLAlchemy 2 + Alembic, pydantic v2, PostgreSQL + pgvector, Redis.
- Fully dynamic: every piece of content (profile, experience, projects, skills, graph nodes/edges, resume, journal posts) comes from the database through REST APIs and is editable from a secure /admin panel. No hard-coded content in the frontend.
- AI: a RAG agent that answers questions about me with citations that light up graph nodes, SSE streaming, guardrails, a token budget, caching, tracing and evals. Later: recruiter JD match, voice "Jarvis" mode in /lab, an MCP server, and /llms.txt.
- Everything listed in docs/features.md and docs/backlog.md, including the "Later / ideas" items, delivered in phases.

## 2. How we work (rules for every phase)
1. Start each phase in plan mode: give me the phase plan (files, packages with versions, data models, endpoints, tests, risks) and WAIT for my "OK" before writing code.
2. Implement in small, logical commits (Conventional Commits). Explain new backend/AI concepts briefly as you go; I'm a frontend developer learning Python and AI engineering.
3. After implementing, run linters, type checks, unit tests, integration tests and e2e tests yourself, and fix every failure before reporting.
4. Debug protocol for any bug: reproduce → read the logs and traces → find the root cause (no guess-patching) → fix → add a regression test → note it in docs/debuging.md.
5. End every phase with a report:
   - What was built (short)
   - Test results (counts, coverage %, Lighthouse/axe scores where relevant)
   - **"Manual test checklist for Chandrashekhar":** numbered steps I should do myself (exact URLs, clicks, inputs, expected result, what a failure looks like), covering desktop, mobile and both themes
   - Security notes and anything I must configure (keys, accounts, env vars)
   - Updated docs/backlog.md checkboxes, updated "Current status" in CLAUDE.md, updated docs where the design changed
6. Never commit secrets. Use .env (gitignored) plus a complete .env.example.
7. Don't move to the next phase until its quality gates pass and I say "next".
8. If something in the docs is wrong or outdated, tell me and propose the change. Don't silently deviate.

## 3. Phases (adjust the detail in your plans; keep this order)
- **Phase 0, Foundation:** check my machine (OS, git, Node LTS, npm/pnpm, Python 3.12+, uv, Docker) and tell me exactly what to install. Monorepo layout from CLAUDE.md (apps/web, apps/api, apps/worker, apps/mcp, content/, infra/). docker-compose (Postgres + pgvector, Redis; later Ollama), Makefile or task runner, pre-commit (ruff, eslint, prettier, gitleaks), EditorConfig, GitHub Actions CI (lint + typecheck + test + build for web and api), branch protection guidance.
- **Phase 1, Frontend foundation:** Angular SSR app, design tokens and themes from the prototype, layout, nav, ⌘K palette, native cursor (custom cursor effects were removed; see Design.md), hero canvas, all home sections with @defer (on viewport) + skeleton placeholders loading one by one, project cards loading card-by-card, knowledge graph component, routes (/, /work, /work/:slug, /lab, /graph, /journal, /resume, 404). Temporary mock data via an Angular service interface, so swapping to the API later touches one place. SEO (meta, OG, JSON-LD, sitemap, robots), a11y. Tests: unit (Vitest or Jest + Angular Testing Library), Playwright e2e, axe, Lighthouse CI budgets.
- **Phase 2, Backend core + database:** FastAPI app factory, settings, layered structure (routers/services/repositories/schemas), all tables from docs/database.md, Alembic migrations, seed from content/, public read APIs from docs/API.md with caching + ETag, contact endpoint (Turnstile + rate limit + email via Resend), health checks, structured JSON logging with request IDs, OpenAPI docs. Frontend switches from mocks to the real API. Tests: pytest + httpx + testcontainers Postgres, ≥ 85% coverage on services.
- **Phase 3, Admin panel (makes it fully dynamic):** secure auth (argon2 password hash, short-lived JWT in an httpOnly Secure SameSite cookie + refresh rotation, CSRF protection, login rate limit/lockout, optional TOTP 2FA), /admin in Angular (lazy, guarded; PrimeNG allowed here) with CRUD for profile, experience, projects (markdown + image upload to object storage), skills, graph nodes/edges, journal posts, resume PDF, contact inbox. Changes trigger cache invalidation and re-indexing.
- **Phase 4, RAG agent:** worker ingestion (parse → chunk → embed → upsert to pgvector, idempotent via checksums), hybrid retrieval (vector + full-text) + rerank, LLM provider abstraction (Claude primary, fallback provider, Ollama for local dev), POST /chat with SSE (meta/token/citations/done events), frontend chat widget with streaming, citations → graph highlight, feedback 👍/👎, guardrails (input limits, prompt-injection defence, answer-only-from-context, "I don't know" fallback), per-IP rate limit + Turnstile + global daily token budget kill-switch, answer cache, Langfuse tracing. Eval set of ≥ 50 Q&A, including trick questions, run in CI (promptfoo or Ragas) with pass thresholds.
- **Phase 5, Graph-grounded + recruiter features:** graph-hop retrieval expansion, LangGraph router (intents: about / skills / project / jd_match / contact / off-topic), POST /match (JD → fit report with evidence and honest gaps), the /graph full-screen page with an accessible list fallback.
- **Phase 6, AI Lab + voice "Jarvis":** /lab page with live agent status, models, latency and eval scores (real data from the backend), voice mode (Web Speech API first, then a realtime voice provider behind a feature flag + budget), interruptible, animated orb.
- **Phase 7, MCP + AI discoverability:** FastMCP server (get_profile, list_projects, get_project, search_portfolio, match_job_description; resources resume://latest, project://{slug}), read-only, rate-limited, Streamable HTTP at /mcp; /llms.txt and /llms-full.txt generated from the DB.
- **Phase 8, Showcase extras:** live mini-demos (CAD canvas editor, PDF viewer, 100k-row virtual grid), journal/blog with MDX-like markdown, GitHub activity widget (server-side cached), moderated guestbook, privacy-friendly analytics (Umami/Plausible), OG image generation.
- **Phase 9, Security hardening, performance and launch:**
  - Security: OWASP ASVS L1 checklist, strict CSP with nonces, HSTS, CORS allow-list, security headers check, dependency audit (npm audit, pip-audit), secret scanning, OWASP ZAP baseline scan in CI, upload validation, SSRF/XSS/SQLi tests.
  - Performance: LCP < 2.0 s, CLS < 0.05, INP < 200 ms, initial JS < 180 KB gzipped, images AVIF/WebP, k6 load test on /chat.
  - Operations: backups and restore drill, Sentry (web + api) with source maps, uptime monitoring, error alerting.
  - Launch: production deploy (web on Vercel or Cloudflare; API on Render/Fly/Railway; DB on Neon/Supabase; Redis on Upstash), custom domain + HTTPS, staging environment, docs/RUNBOOK.md (deploy, rollback, rotate keys, restore DB).

## 4. Always-on quality bar
TypeScript strict, no `any`; Angular OnPush; Python fully typed (mypy/pyright) + ruff; WCAG 2.2 AA; prefers-reduced-motion respected; no API keys in the browser; every endpoint validated, rate-limited where public, and covered by tests.

## 5. Start now
1. Confirm you've read the files: summarise the project in 5 bullets.
2. Ask me, in ONE batch, everything you need from me: my real profile data (headline, experience, projects, skills, links, resume), preferred domain name, hosting accounts I have, which LLM API keys I have, my OS and what's installed.
3. Then present the Phase 0 plan and wait for my OK.

## Maintenance note — 2026-11-10 (Codex)
This is the original implementation brief, not a request to restart Phase 0. Current status is tracked in docs/plan.md and docs/backlog.md. Later owner decisions in CLAUDE.md and Design.md supersede the original prototype cursor requirements. Codex maintenance work is attributed in docs/change-log.md.
