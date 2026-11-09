-- Runs once, when the database volume is first created.
-- Extensions the app needs (Alembic migrations will also ensure these).
CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector: embeddings + similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy text matching for hybrid search
