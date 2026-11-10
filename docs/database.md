# Database

Status: design proposal; no application tables or migrations exist yet. Codex reconciled
this outline with the current content schemas on 2026-11-10. The Phase 2 plan must finalize
constraints, indexes, deletion rules, ordering and migration/seed behavior before implementation.

## Content

- `profile`: name, initials, title, headline, shortBio, bio, location/locationShort,
  heroTitle, heroCta, roles, availability, photo, links, stats, placeholderFields.
  Preserve structured display fields as JSONB where appropriate. Computed stats retain their
  computation keys; experience duration is derived from dates.
- `organization`: stable content ID, name, kind, URL, placeholder status.
- `experience`: stable role ID, organization reference, role, start/end month, summary,
  highlights, skill associations and display order.
- `education`: stable ID, institute, shortName, degree/field, start/end, skill associations,
  placeholder status and all optional fields in `education.schema.json`.
- `project`: stable slug, title, summary, Markdown body, type, status, featured, skills,
  tags, filters, illustration, organization, role, period, cover, links, placeholder status.
  Professional projects retain the existing restriction on employer links and screenshots.
- `skill`: stable ID, name, category, optional proficiency (`strong|good|learning`),
  concept flag and all remaining fields in `skills.schema.json`.
  Categories: `frontend|cad|documents|realtime|performance|backend|ai|fundamentals|leadership`.
- `about`: ordered experience areas (ID/title/icon/summary/skills/hub/growing) and howIWork steps.
- `lab_timeline`: ordered topic entries, optional when/progress. Live agent metrics are a
  separate operational resource, not fabricated timeline values.

The JSON Schemas in `content/schemas/` are the field-level seed/export contracts. API
responses follow `ContentRepository` (see API.md); table normalization must preserve those
shapes. Keep seed-only Markdown paths separate from the API's `bodyMarkdown` field.

## Knowledge graph

Use stable text node IDs as primary keys, matching the frontend:
`skill:<id>`, `project:<slug>`, `org:<id>`, `edu:<id>`, `hub:<category>`, `topic:<id>`.

- `node(id text PK, kind, ref_id, label, category, size, learning)`
- `edge(id, source text FK→node, target text FK→node, rel)`
- Kinds: `hub|skill|concept|project|org|education|topic`.
- Relations: `USED|BUILT_AT|WORKED_AT|STUDIED|RELATED|IN_CATEGORY|BUILT_ON|DEMONSTRATES`.
- Derived nodes/edges come from skills, projects, organizations, education and role skills.
  `graph.json` contributes topics and extra edges. Preserve the current visual graph's
  unordered-pair deduplication; revisit multiple directed relations explicitly before graph-hop retrieval.

## RAG and operations (later phases)

```text
document(id, source, source_ref, title, url, checksum, updated_at)
chunk(id, document_id FK, ord, text, tokens, node_ids text[], embedding vector(N), tsv tsvector)
chat_session(id uuid, created_at, ip_hash, user_agent, mode)
chat_message(id uuid, session_id FK, role, content, citations text[], tokens_in, tokens_out, latency_ms, model)
feedback(id, message_id FK, rating, comment)
contact_message(id, name, email, reason, body, created_at, status)
admin_user(id, email, password_hash, created_at)
```

Embedding dimension `N` is fixed by the selected embedding model before migration;
use HNSW cosine indexing and GIN full-text indexing when RAG is implemented.
Add journal/media/resume, refresh tokens/TOTP, guestbook and eval-run tables in their
approved phase plans. Store IPs as salted hashes; implement the planned 90-day chat retention.

## Ownership and migration

Today `content/` is the active build-time source. After Phase 2 the database becomes the
source of truth; Phase 3 adds admin editing and a versioned DB → `content/` export.
Alembic owns migrations. Seeding must be idempotent using stable IDs and validated references.
Worker/MCP reuse API services; neither maintains a second content or graph source.
