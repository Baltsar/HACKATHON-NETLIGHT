#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
if [[ -z "${TAVILY_API_KEY:-}" ]]; then
  echo "TAVILY_API_KEY missing in .env.local" >&2
  exit 1
fi
exec npx -y tavily-mcp@latest
