#!/usr/bin/env bash
# Smoke test for the built SSR server (run after `make build`).
# Checks: the home page is server-rendered (has the <h1>), and an unknown
# Host header is rejected (Angular's SSRF protection is still on).
set -euo pipefail

PORT="${PORT:-4310}"
SERVER="apps/web/dist/web/server/server.mjs"

PORT="$PORT" node "$SERVER" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# Wait up to ~10 s for the server to answer.
for _ in {1..20}; do
  curl -sf -o /dev/null "http://localhost:$PORT/" && break
  sleep 0.5
done

html="$(curl -sf "http://localhost:$PORT/")"
grep -q '<h1[^>]*>Chandrashekhar</h1>' <<<"$html" || { echo "✗ SSR HTML missing <h1>"; exit 1; }
echo "✓ home page is server-rendered"

status="$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: evil.example' "http://localhost:$PORT/")"
[[ "$status" == "400" ]] || { echo "✗ unknown Host returned $status, expected 400"; exit 1; }
echo "✓ unknown Host header is rejected"
