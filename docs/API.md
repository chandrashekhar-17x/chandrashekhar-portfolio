# API

| Method | Path                          | Purpose                             | Auth / limits                |
|--------|-------------------------------|-------------------------------------|------------------------------|
| GET    | `/profile`                    | Name, headline, links, availability | public · cached 1h           |
| GET    | `/projects?featured=true`     | Project list                        | public · cached              |
| GET    | `/projects/{slug}`            | Case study                          | public                       |
| GET    | `/experience`                 | Timeline                            | public                       |
| GET    | `/skills`                     | Skills by category                  | public                       |
| GET    | `/graph`                      | {nodes, links} for the visual       | public · ETag                |
| POST   | `/chat`                       | Ask the agent; **SSE stream**       | Turnstile · 20 req/10 min/IP |
| POST   | `/chat/{message_id}/feedback` | 👍 / 👎                             | public                       |
| POST   | `/match`                      | JD → fit report (JSON)              | Turnstile · 5/day/IP         |
| POST   | `/contact`                    | Send message                        | Turnstile · 3/h/IP           |
| POST   | `/admin/login`                | JWT                                 | —                            |
| POST   | `/admin/ingest`               | Re-index content                    | admin                        |
| GET    | `/admin/chats`                | Review conversations                | admin                        |
| GET    | `/health`                     | Liveness / readiness                | public                       |

### Chat stream contract (SSE)

    POST /api/v1/chat
    { "session_id": "uuid", "message": "Has he built a PDF viewer?", "mode": "text" }

    event: meta       data: {"message_id": 812, "intent": "project"}
    event: token      data: {"t": "Yes — "}
    event: token      data: {"t": "he built a PDF rendering…"}
    event: citations  data: {"nodes": [14, 3], "urls": ["/work/pdf-engine"]}
    event: done       data: {"tokens_out": 142, "latency_ms": 1630}

### Errors

    { "error": { "code": "RATE_LIMITED", "message": "Try again in 4 min", "request_id": "…" } }
