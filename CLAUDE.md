# CLAUDE.md — Project memory for Claude Code

> Claude Code reads this file automatically when it starts in this folder.
> It carries over everything decided in the original claude.ai chat (Nov 2026).
> Full history: @docs/conversation-log.md

## Who I am (owner)
- **Chandrashekhar**: frontend developer (Angular, TypeScript, JavaScript, RxJS, PrimeNG).
- Built: CAD editor (canvas), PDF rendering (PDF.js), PrimeNG data tables, API integrations; loves animation (2D/3D, cursor, text, cards).
- Currently learning **Python backend (FastAPI)** and **AI engineering** (LLMs, RAG, LangChain/LangGraph, MCP, voice agents).
- Location: India. Open to frontend and AI-engineering roles.
- Explain backend/AI concepts as you go: I'm learning them while building.

## What we're building
An **AI-native portfolio website**: responsive, dynamic, lazy-loaded, secure, optimised, interactive and premium (dark + light).
**Signature idea:** a *knowledge graph* of my skills, projects and jobs that the *AI agent cites*. When someone asks a question, the answer streams in and the graph nodes it used light up.

Positioning line: *"Frontend engineer who builds complex UIs (CAD editors, PDF engines, data grids), now building the AI systems behind them."*

## Current status
- ✅ Planning done: all docs in `docs/` (PRD, Design, Architecture, database, API, agents, mcp, integration, features, plan, testing, debuging, review, backlog).
- ✅ Clickable prototype: `prototype/index.html` (single self-contained file; open in a browser).
- ⏭️ **Next: full implementation, Phase 0 → Phase 9**, following `docs/IMPLEMENTATION_PROMPT.md` (the master brief). The single-file prototype is a reference only; the real app is Angular + FastAPI + Postgres/pgvector + Redis, fully dynamic with an admin panel.
- ⚠️ Working agreement: **propose a plan and get my OK before large implementations.** I asked to design first, then implement.

## Key decisions (don't silently change these)
| Area | Decision |
|---|---|
| Frontend | Angular 20+, standalone components, signals, zoneless, SSR + incremental hydration, `@defer (on viewport)` per section, SCSS + CSS tokens, container queries |
| Effects | Canvas hero (starfield + perspective wave grid), force-directed knowledge graph, 3D tilt cards, magnetic buttons, text scramble/typing, **splash cursor (WebGL fluid, lime #84cc16, size 0.7)** + custom arrow cursor with context labels; all respect `prefers-reduced-motion` and are off on touch |
| Loading | Sections load **one at a time** via `@defer (on viewport)` with same-size skeletons (no layout shift); project cards load card-by-card |
| Backend | FastAPI (async), SQLAlchemy 2 + Alembic, pydantic, Redis (rate-limit + cache) |
| Data | PostgreSQL + **pgvector** = single store for content, graph (node/edge tables) and embeddings. `content/` folder (MD + JSON) in git is the source of truth; DB is rebuilt by the ingest worker |
| AI | RAG with citations (node ids) → graph highlight; streaming over SSE; LLM provider abstraction (Claude primary, Groq fallback, OpenAI embeddings, Ollama for local dev); learn the raw SDK first, LangGraph later |
| Safety | No API keys in the browser; Turnstile + IP rate limits + daily token budget kill-switch; answer only from my data ("I don't know" fallback); prompt-injection guard |
| Extras | MCP server (FastMCP) exposing my portfolio to other AI agents; `/llms.txt` |
| Jarvis | Voice "Jarvis mode" lives in **/lab** as a section/page, NOT the homepage (too dense for recruiters) |
| Hosting | Web on Vercel/Cloudflare; API on Render/Fly/Railway; DB on Neon/Supabase |

## Target repo layout (to create in Phase 0)
```
apps/web      Angular SSR site
apps/api      FastAPI (REST + SSE chat)
apps/worker   ingestion: parse → chunk → embed → upsert
apps/mcp      FastMCP server
content/      markdown + json (source of truth)
docs/         planning docs (this folder)
prototype/    the HTML prototype (reference for look & feel)
reference/    my 5 inspiration images (ref-1..5)
```

## Prototype → Angular mapping (reuse the logic)
`prototype/index.html` contains working vanilla JS to port into Angular components and directives:
- `drawHero()`: hero canvas → `HeroCanvasComponent` (run outside Angular, pause off-screen)
- `kg` force graph + `drawKG()`: `KnowledgeGraphComponent` (later fed by `GET /api/v1/graph`)
- `splash` IIFE (WebGL fluid sim): `SplashCursorDirective` / service, lazy-loaded
- cursor IIFE: `CursorComponent` (arrow + context label)
- `lazy` IIFE: replaced natively by `@defer (on viewport)` + `@placeholder` / `@loading` blocks
- `KB` + `ask()`: scripted chat → later replaced by the real `/api/v1/chat` SSE stream
- `.pcard` tilt/glare: `TiltDirective`; `.magnetic`: `MagneticDirective`
- Design tokens are the CSS custom properties at the top of the file (dark + `[data-theme="light"]`)

## Placeholders to replace with my real data
Company names ("Company A/B (sample)"), years, stats (4+ years, 30+ projects), experience entries, project descriptions, and `chandrashekhar.dev` domain.

## Conventions
- TypeScript strict; Angular `OnPush`; no `any`.
- Python: type hints, ruff + pytest, `uv` for env/deps.
- Animate only `transform` / `opacity`; every effect skippable.
- Lighthouse ≥ 95 desktop; WCAG 2.2 AA.
- Commit small; update `docs/backlog.md` checkboxes when an item ships.

## Docs index
`docs/PRD.md` · `docs/Design.md` · `docs/Architecture.md` · `docs/architecture-sequence.md` · `docs/database.md` · `docs/API.md` · `docs/agents.md` · `docs/mcp.md` · `docs/integration.md` · `docs/features.md` · `docs/plan.md` · `docs/testing.md` · `docs/debuging.md` · `docs/review.md` · `docs/backlog.md` · `docs/README.dev.md`
