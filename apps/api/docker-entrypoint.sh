#!/bin/sh
# Container start: migrate, optionally seed from content/, then serve.
set -e

alembic upgrade head

# Until the admin panel (Phase 3) edits content in the database, content/ in the
# repo is the source of truth: SEED_ON_START=true re-syncs it on every deploy.
# Turn it off once you edit content in /admin, or the seed would overwrite it.
if [ "${SEED_ON_START:-false}" = "true" ]; then
  python -m portfolio_api.content.seed
fi

# --proxy-headers: behind the host's load balancer, the visitor IP (used for the
# contact rate limit, stored only as a salted hash) comes from X-Forwarded-For.
exec uvicorn portfolio_api.main:create_app --factory \
  --host 0.0.0.0 --port "${PORT:-8000}" \
  --proxy-headers --forwarded-allow-ips='*'
