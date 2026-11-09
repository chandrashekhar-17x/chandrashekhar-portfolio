# Chat request sequence & rationale

### Chat request — sequence

1.  **1**Browser POST /api/v1/chat {message, session_id} + Turnstile token
2.  **2**Gateway: rate-limit (Redis), validate length, injection pre-check
3.  **3**Router (small model) → intent: about \| skills \| project \| jd_match \| contact \| off-topic
4.  **4**Retrieve: pgvector top-k + keyword → graph-hop neighbors → rerank
5.  **5**Generate with system prompt + context; stream tokens via SSE
6.  **6**Emit event `citations: [node_ids]` → frontend highlights graph
7.  **7**Log trace (Langfuse), cache answer, store feedback 👍/👎

### Why these choices

- **Angular** — your strongest skill; SSR, signals, `@defer` give you lazy-loading natively. Shows depth, not tutorial-React.
- **FastAPI** — Python is where AI tooling lives; async + pydantic + auto OpenAPI docs.
- **pgvector over a separate vector DB** — one database for content, graph and embeddings; less ops, real SQL skill.
- **LangGraph** only once you need multi-step agents; start with plain SDK calls to learn fundamentals.
- **MCP server** — rare on portfolios; proves you understand the 2026 agent ecosystem.
