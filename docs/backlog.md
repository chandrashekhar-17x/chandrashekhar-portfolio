# Backlog

Effort: S / M / L · Area: fe · be · ai · ops · ux. Tick items as they ship.
Phases match `docs/plan.md` (0–9).

## Phase 0 · Foundation

- [x] Monorepo (pnpm + uv workspaces) + Makefile — `ops` · S
- [x] Docker Compose: Postgres + pgvector, Redis, Ollama profile — `ops` · S
- [x] CI (GitHub Actions) + Dependabot + pre-commit (incl. gitleaks) — `ops` · S
- [x] Design tokens (colours, type, spacing, motion; dark + light) — `ux` · S
- [x] `content/` schemas + seed data + validator — `be` · S
- [x] FastAPI skeleton + settings + /health — `be` · S
- [x] Replace placeholder content with real data (2026-11-10; photo, resume and domain still dummy: `make content-check`) — `ux` · S
- [x] Confidentiality check (hashed internal-name list) in `make check` + CI — `ops` · S
- [x] Agent eval seed `content/evals/agent-evals.json` (profile-data §9), run against the scripted chat — `ai` · S

## Phase 1 · Frontend foundation

- [x] Theme toggle + self-hosted fonts — `ux` · S
- [x] Hero canvas + typed text — `fe` · M
- [x] Knowledge graph from mock data — `fe` · M
- [x] Projects + case-study route — `fe` · M
- [x] Experience, resume page (+ print-to-PDF; real `resume.pdf` still to add) — `fe` · S
- [x] Scripted chat widget (fallback) — `fe` · S
- [x] Section-by-section lazy loading (@defer on viewport) + skeletons — `fe` · S
- [ ] Attractive, lightweight pointer effect (splash + eased arrow cursor tried and removed: too slow / laggy) — `ux` · M
- [x] Command palette, magnetic buttons, tilt cards — `ux` · S
- [x] SEO, OG, sitemap, robots, JSON-LD — `fe` · S
- [x] A11y + reduced motion; Playwright e2e + axe + Lighthouse CI — `ux` · M
- [ ] Deploy preview to Vercel/Cloudflare (needs owner's account) — `ops` · S
- [x] Screenshot tests (Docker), prototype parity report — `fe` · S

## Phase 2 · Backend core + database

- [ ] Layered FastAPI (routers/services/repositories/schemas), JSON logs + request ids — `be` · M
- [ ] Postgres tables + Alembic + seed from content/ — `be` · M
- [ ] Public content & graph endpoints (cache + ETag) — `be` · S
- [ ] Contact + Turnstile + rate limit + Resend — `be` · S
- [ ] Web switches from mocks to the API — `fe` · S

## Phase 3 · Admin panel

- [ ] Auth: argon2, JWT httpOnly cookies + refresh rotation, CSRF, lockout, TOTP — `be` · M
- [ ] /admin CRUD (profile, experience, projects, skills, graph, journal, resume, inbox) — `fe` · L
- [ ] Uploads to object storage + cache invalidation + re-index trigger — `be` · M
- [ ] `make content-export` (DB → content/) — `be` · S

## Phase 4 · RAG agent

- [ ] Ingest: parse → chunk → embed → upsert (idempotent) — `ai` · L
- [ ] Hybrid retrieval + rerank; provider abstraction (Claude, fallback, Ollama) — `ai` · M
- [ ] /chat SSE streaming + citations → graph highlight — `ai` · M
- [ ] Guardrails, rate limit, Turnstile, daily token budget, answer cache — `be` · M
- [ ] Langfuse tracing; eval set (≥ 50 Q&A) in CI — `ai` · M

## Phase 5 · Graph-grounded + recruiter

- [ ] Graph-hop retrieval expansion — `ai` · M
- [ ] LangGraph intent router — `ai` · M
- [ ] Recruiter JD match (/match) — `ai` · M
- [ ] /graph full-screen page + accessible list fallback — `fe` · M

## Phase 6 · AI Lab + voice

- [ ] /lab page with live agent status, models, latency, eval scores — `fe` · M
- [ ] Voice: Web Speech in/out, interruptible, animated orb — `ai` · M
- [ ] Realtime voice provider behind a feature flag + budget — `ai` · L

## Phase 7 · MCP + discoverability

- [ ] MCP server (FastMCP, Streamable HTTP at /mcp, read-only, rate-limited) — `ai` · M
- [ ] /llms.txt + /llms-full.txt generated from the DB — `ai` · S

## Phase 8 · Showcase extras

- [ ] **CAD Playground (public demo), high priority**: standalone lazy route `/lab/cad-playground`; Three.js; public sample DXF files (check licences); rbush R-tree with an overlay toggle; hover/select; move/copy/delete; undo/redo; fit-to-screen; DXF export; red/green diff between two sample versions; reduced-motion and mobile friendly; own e2e tests — `fe` · L
- [ ] Bounding-box overlay demo on a public sample web page — `fe` · S
- [ ] Live CAD mini-demo (superseded by the CAD Playground) — `fe` · M
- [ ] PDF viewer demo — `fe` · M
- [ ] 100k-row grid demo — `fe` · S
- [ ] Journal / learning log — `fe` · M
- [ ] GitHub activity widget (server-side cached) — `be` · S
- [ ] Guestbook (moderated) — `be` · S
- [ ] Privacy analytics (Umami/Plausible) — `ops` · S
- [ ] OG image generation — `fe` · S

## Phase 9 · Security, performance, launch

- [ ] ASVS L1 checklist, CSP nonces, HSTS, ZAP baseline in CI — `ops` · M
- [ ] Perf budgets (LCP < 2 s, CLS < 0.05, INP < 200 ms, JS < 180 KB gz), k6 on /chat — `ops` · M
- [ ] Sentry, uptime monitoring, backups + restore drill — `ops` · M
- [ ] Production deploy, custom domain, staging, RUNBOOK — `ops` · M

## Later / ideas

- [ ] Three.js 3D scene behind @defer — `fe` · L
- [ ] Public agent-eval dashboard — `ai` · M
- [ ] Hindi i18n — `fe` · M
- [ ] Yearly redesign changelog — `ux` · S
