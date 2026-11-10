# API

Status: proposed contract for Phases 2–7, reconciled by Codex on 2026-11-10.
Today the API has health checks only: `GET /health` (and `/health/live`) for liveness, `GET /health/ready` for readiness (Postgres + Redis; 503 if either is down). Every response carries `X-Request-ID`; errors use `{"error": {"code", "message", "request_id"}}`. Public content and chat routes below use `/api/v1`;
health and the future `/mcp` endpoint remain outside that prefix.

| Method | Path (under `/api/v1`) | Response / purpose | Phase |
| --- | --- | --- | --- |
| GET | `/profile` | `Profile` | 2 |
| GET | `/projects?featured=true` | `Project[]`, optional featured filter | 2 |
| GET | `/projects/{slug}` | `ProjectDetail` including `bodyMarkdown`; missing slug → 404 | 2 |
| GET | `/experience` | `Experience`: organizations and roles | 2 |
| GET | `/skills` | `Skill[]` | 2 |
| GET | `/education` | `EducationEntry[]` | 2 |
| GET | `/about` | `About`: areas and howIWork | 2 |
| GET | `/lab` | `AILab`: learning timeline only | 2 |
| GET | `/graph` | `KnowledgeGraph`: nodes and links | 2 |
| POST | `/contact` | Delivery result; Turnstile, 3/hour/IP | 2 |
| POST | `/admin/login` | Secure cookie authentication | 3 |
| POST | `/admin/ingest` | Enqueue re-indexing; admin only | 4 |
| GET | `/admin/chats` | Conversation review; admin only | 4 |
| POST | `/chat` | SSE stream; Turnstile, 20 requests/10 min/IP | 4 |
| POST | `/chat/{message_id}/feedback` | Rating; validate and rate-limit | 4 |
| POST | `/match` | JD fit report; Turnstile, 5/day/IP | 5 |
| GET | `/lab/status` | Real agent/model metrics, distinct from learning content | 6 |

Public reads use caching and ETags; lifetimes and invalidation are finalized in the
Phase 2 plan. Existing content schemas and `ContentRepository` define response shapes;
JSON file metadata such as `$schema` is not part of the API response. These endpoints
return the array/object that each repository method consumes, without seed-file wrappers.

## Stable identifiers

Use string IDs across content, API, graph, and citations, preserving existing IDs:
`skill:angular`, `project:custom-cad-editor`, `org:vassardigital`,
`edu:nit-jamshedpur`, `hub:frontend`, and `topic:<id>`.
Graph nodes contain `id`, `kind`, `label`, `category`, `size`, and `learning`;
links contain `source`, `target`, and `rel`. Citation IDs must resolve to actual nodes.
Message/session IDs are strings (UUIDs for the future backend), never numeric IDs in the wire format.

## Chat stream contract (SSE)

Request to `POST /api/v1/chat`:

```json
{"session_id":"uuid","message":"Has he built a PDF viewer?","mode":"text","turnstile_token":"token"}
```

```text
event: meta
data: {"message_id":"uuid","intent":"project"}

event: token
data: {"t":"He built a progressive PDF viewer."}

event: citations
data: {"nodes":["project:progressive-pdf-viewer","skill:pdfjs"],"urls":["/work/progressive-pdf-viewer"]}

event: done
data: {"tokens_out":142,"latency_ms":1630}
```

The SSE adapter maps snake_case wire keys to the existing `ChatEvent` camelCase keys:
`message_id` → `messageId`, `tokens_out` → `tokensOut`, `latency_ms` → `latencyMs`.
The named SSE event becomes `ChatEvent.type`. IDs remain strings in both formats.
Cancellation, heartbeat behavior and stream-error events must be finalized before Phase 4.

## Errors

```json
{"error":{"code":"RATE_LIMITED","message":"Try again in 4 min","request_id":"uuid"}}
```
