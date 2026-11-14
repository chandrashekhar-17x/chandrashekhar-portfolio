# CLAUDE.md — Project memory for Claude Code

> Claude Code reads this file automatically when it starts in this folder.
> It carries over everything decided in the original claude.ai chat (Nov 2026).
> Full history: @docs/conversation-log.md

## Who I am (owner)
- **Chandrashekhar**: Software Engineer, Frontend (Angular) at VassarDigital.ai since Jan 2024; before that Vassar Labs (full-time Aug–Dec 2023, intern Jan–Jul 2023). MCA, NIT Jamshedpur (2020–2023). 3+ years (always computed from dates).
- Built: a custom Three.js CAD/DXF viewer & editor from zero (flagship), railway signalling-plan editing on top of it, PDF viewers (PDF.js + Range Requests, precise highlighting), data-extraction UIs, SSE integrations; loves animation (2D/3D, cursor, text, cards).
- Currently learning **Python backend (Django/FastAPI)** and **AI engineering** (LLMs, RAG, LangChain/LangGraph, MCP, voice agents).
- Location: Hyderabad, India. Availability pill hidden by default (currently employed).
- ⚠️ **Confidentiality:** office projects appear only under public titles; internal product names are never written in this public repo (`make confidential-check`, hashed list). No employer screenshots, code or repo links.
- Explain backend/AI concepts as you go: I'm learning them while building.

## What we're building
An **AI-native portfolio website**: responsive, dynamic, lazy-loaded, secure, optimised, interactive and premium (dark + light).
**Signature idea:** a *knowledge graph* of my skills, projects and jobs that the *AI agent cites*. When someone asks a question, the answer streams in and the graph nodes it used light up.

Positioning line: *"Frontend engineer who builds complex UIs (CAD editors, PDF engines, data grids), now building the AI systems behind them."*

## Current status
- ✅ Planning done: all docs in `docs/` (PRD, Design, Architecture, database, API, agents, mcp, integration, features, plan, testing, debuging, review, backlog).
- ✅ Clickable prototype: `prototype/index.html` (single self-contained file; open in a browser).
- ✅ **Phase 0 (Foundation) done (2026-11-09):** pnpm + uv monorepo, Angular 22 SSR shell + design tokens, FastAPI skeleton (`/health`), Docker (pgvector pg17 on :5433, Redis on :6380), `content/` schemas + seed + validator, Makefile, pre-commit (gitleaks), GitHub Actions CI. `make check` is green.
- ✅ **Phase 1 (Frontend foundation) built (2026-11-10), PRs 1–6 + 8:** Angular 22 site with every prototype section (hero canvas, knowledge graph with filters/list view/endless drift, tilt work cards, AI Lab orb HUD, experience timeline, contact form), skeleton-first `@defer` loading revealed one at a time, scripted chat whose citations light the graph (same event contract as the future SSE API), ⌘K palette, SEO (meta/OG/JSON-LD/sitemap/robots), axe 0 serious issues, Lighthouse 100/100/100/100, 40 Docker screenshot baselines. Custom cursors removed (owner: too slow/laggy). Data comes from `content/` via `ContentRepository` (swap to HTTP in Phase 2).
- ✅ **Content update (2026-11-10, `feat/content-real-data`):** real data from the owner's v1+v2 content prompts (v2 wins), new schemas (education, about, project type/tags/filters/illustration, skill proficiency/concept, computed stats), LinkedIn-style durations, Person JSON-LD per §10, scripted chat + §9 eval set, confidentiality checker in CI.
- 🔧 **Codex maintenance (2026-11-10):** completing the existing featured case-study band, fixing parsing/build issues, isolating API tests, unifying public-origin configuration, and reconciling contracts/status docs. See `docs/change-log.md` for attribution and verification. Done on `feat/web-content-ui`: About + How I work, featured band, grouped experience + education, work filters + 11 distinct thumbnails, case-study template (TOC, TL;DR, stepper, chip groups, problem cards, prev/next), graph edge labels + growing rings + phone drill-down, per-project OG images + Article JSON-LD. Still to do: the CI speed-up PR.
- ✅ **Phase 2 PR 1 (API foundation)** and **PR 2 (DB + seed, `feat/db-seed`)** built (2026-11-10): request ids, JSON logs, error shape, readiness; content tables + Alembic `0001` + idempotent `make seed` with a lossless round-trip test on real Postgres (CI service container).
- ✅ **Phase 2 complete (2026-11-14):** read API + cache/ETag + web switch, contact API (rate limit, Turnstile, Resend), API Docker image + `render.yaml` (Render + Neon + Upstash, guide: `docs/deploy-api.md`). Site live at https://chandrashekhar.pages.dev (Cloudflare Pages, from `main`). Extras live: blueprint mode, DevTools console API, Hyderabad clock, graph visitor trail, "Ask about this project".
- ⚠️ PRs have been merged into `main` (GitHub's default base), so `develop` is stale: either set `develop` as the default branch on GitHub or drop it.
- ⏭️ **Next: owner hosts the API (`docs/deploy-api.md`), then Phase 3 (admin) or Phase 4 (RAG) — owner's call.** Follow `docs/IMPLEMENTATION_PROMPT.md` through Phase 9. The prototype is a reference only.
- 🧑 Owner TODO: replace placeholder content (`make content-check` lists it), add `content/resume/resume.pdf`, set branch protection (`docs/CONTRIBUTING.md`), install + log in to `gh` (lets Claude open PRs and read CI), choose the domain and a hosting account for the preview deploy.
- ⚠️ Working agreement: **propose a plan and get my OK before large implementations.** I asked to design first, then implement.

## Key decisions (don't silently change these)
| Area | Decision |
|---|---|
| Frontend | Angular 22 (TS 6.0), standalone components, signals, zoneless, SSR + incremental hydration, `@defer (on viewport)` per section, SCSS + CSS tokens, container queries |
| Effects | Canvas hero (starfield + perspective wave grid), force-directed knowledge graph, 3D tilt cards, magnetic buttons, text scramble/typing, **default system cursor for now** (2026-11-09: the WebGL splash cursor was too slow and the custom arrow cursor felt laggy, so both were removed at the owner's request; an attractive, lightweight pointer effect will be designed later); all respect `prefers-reduced-motion` and are off on touch |
| Loading | Sections load **one at a time** via `@defer (on viewport)` with same-size skeletons (no layout shift); project cards load card-by-card |
| Backend | FastAPI (async), SQLAlchemy 2 + Alembic, pydantic, Redis (rate-limit + cache) |
| Data | PostgreSQL + **pgvector** = single store for content, graph (node/edge tables) and embeddings. **DB is the source of truth** (edited in /admin); `content/` = first seed + versioned export. Graph nodes are derived from skills/projects/experience; `graph.json` only adds topics + extra edges |
| AI | RAG with citations (node ids) → graph highlight; streaming over SSE; LLM provider abstraction (Claude primary, Groq fallback, OpenAI embeddings, Ollama for local dev); learn the raw SDK first, LangGraph later |
| Safety | No API keys in the browser; Turnstile + IP rate limits + daily token budget kill-switch; answer only from my data ("I don't know" fallback); prompt-injection guard |
| Extras | MCP server (FastMCP) exposing my portfolio to other AI agents; `/llms.txt` |
| Jarvis | Voice "Jarvis mode" lives in **/lab** as a section/page, NOT the homepage (too dense for recruiters) |
| Hosting | Web on Vercel/Cloudflare; API on Render/Fly/Railway; DB on Neon/Supabase |
| Tooling | pnpm workspace (web) + uv workspace (Python 3.13: `portfolio_api`, `portfolio_worker`, `portfolio_mcp`, src layout); Makefile; Vitest; ESLint flat config; ruff + mypy strict |
| Git | user `chandrashekhar-17x`, noreply email; feature branches → PR into `develop` → release PR into `main`; hook blocks direct commits to both; required check `CI OK` |
| License | Code MIT; `content/` all rights reserved |

## Repo layout
```
apps/web      Angular SSR site
apps/api      FastAPI (REST + SSE chat)
apps/worker   ingestion: parse → chunk → embed → upsert
apps/mcp      FastMCP server
content/      json + markdown seed, schemas/ (JSON Schema)
infra/        docker-compose (pgvector, redis, ollama)
scripts/      repo tooling (validate_content.py)
docs/         planning docs (this folder)
prototype/    the HTML prototype (reference for look & feel)
reference/    my 5 inspiration images (ref-1..5)
```

## Prototype → Angular mapping (reuse the logic)
`prototype/index.html` contains working vanilla JS to port into Angular components and directives:
- `drawHero()`: hero canvas → `HeroCanvasComponent` (run outside Angular, pause off-screen)
- `kg` force graph + `drawKG()`: `KnowledgeGraphComponent` (later fed by `GET /api/v1/graph`)
- `splash` IIFE: historical reference only; removed by owner decision.
- cursor IIFE: historical reference only; keep the native system cursor.
- `lazy` IIFE: replaced natively by `@defer (on viewport)` + `@placeholder` / `@loading` blocks
- `KB` + `ask()`: scripted chat → later replaced by the real `/api/v1/chat` SSE stream
- `.pcard` tilt/glare: `TiltDirective`; `.magnetic`: `MagneticDirective`
- Design tokens are the CSS custom properties at the top of the file (dark + `[data-theme="light"]`)

## Placeholders to replace with my real data
Run `make content-check` for the live list. Real since 2026-11-10 (from the owner's private profile notes): profile, bio, stats, skills, experience, education, 11 projects + case studies, about areas, lab timeline, agent eval set (`content/evals/`). Resume PDF real since 2026-11-14 (`content/resume/resume.html` → `make resume-pdf`; merged from the owner's 3 resumes: no email in it, Vassar Labs = intern Jan–Jul 2023 + SE Aug–Dec 2023, confirmed extras: Keycloak/Azure MSAL auth and a dynamic form builder; WebRTC, Docker/Jenkins/Node/Express, Sigma.js, Socket.IO, Azure Blob left out as unconfirmed). Still dummy: photo (`content/media/avatar-placeholder.svg`), domain, learning-timeline progress values (not provided). Contact = form only (no public email).

## Conventions
- TypeScript strict; Angular `OnPush`; no `any`.
- Python: type hints, ruff + pytest, `uv` for env/deps.
- Animate only `transform` / `opacity`; every effect skippable.
- Lighthouse ≥ 95 desktop; WCAG 2.2 AA.
- Commit small; update `docs/backlog.md` checkboxes when an item ships.
- Keep files ≤ ~300–400 lines; small focused components; short plain comments; research versions/APIs instead of guessing.

## Docs index
`docs/PRD.md` · `docs/Design.md` · `docs/Architecture.md` · `docs/architecture-sequence.md` · `docs/database.md` · `docs/API.md` · `docs/agents.md` · `docs/mcp.md` · `docs/integration.md` · `docs/features.md` · `docs/plan.md` · `docs/testing.md` · `docs/debuging.md` · `docs/review.md` · `docs/backlog.md` · `docs/README.dev.md` · `docs/CONTRIBUTING.md`
