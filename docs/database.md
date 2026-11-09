# Database

    profile(id, name, headline, summary, location, availability, links jsonb)
    organization(id, name, kind, url)
    experience(id, org_id→organization, role, start_date, end_date, summary, highlights text[])
    project(id, slug unique, title, summary, body_md, cover_url, repo_url, live_url, org_id?, featured bool, year)
    skill(id, name unique, category 'frontend|backend|ai|graphics|tools', level 1-5)

    -- knowledge graph (generic, powers the visual + graph-hop retrieval)
    node(id, kind 'skill|project|org|topic', ref_id, label, weight)
    edge(id, src→node, dst→node, rel 'USED|BUILT_AT|RELATED|LEARNING', weight)

    -- RAG
    document(id, source 'resume|project|md|github', source_ref, title, url, checksum, updated_at)
    chunk(id, document_id→document, ord, text, tokens, node_ids int[], embedding vector(1536), tsv tsvector)
      INDEX hnsw (embedding vector_cosine_ops); INDEX gin (tsv)

    -- conversations & ops
    chat_session(id uuid, created_at, ip_hash, user_agent, mode 'text|voice')
    chat_message(id, session_id, role, content, citations int[], tokens_in, tokens_out, latency_ms, model)
    feedback(id, message_id, rating -1|1, comment)
    contact_message(id, name, email, reason, body, created_at, status)
    analytics_event(id, name, props jsonb, created_at)  -- or use Umami
    admin_user(id, email, password_hash, created_at)

- **Source of truth** = `content/` folder (MD + JSON) in git; DB is rebuilt by the ingest worker. Easy to review, version and roll back.
- Store IP as salted hash only; purge chat logs after 90 days.
- Migrations with Alembic; seed script loads content.
