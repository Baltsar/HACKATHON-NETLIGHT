#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER="${1:-}"
shift || true
PROMPT="${*:-}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/delegate.sh status
  ./scripts/delegate.sh claude "build the 10s hook director"
  ./scripts/delegate.sh codex  "review src/lib/agent.ts and patch bugs"

Claude uses your Claude subscription. Codex uses your ChatGPT subscription.
Both read AGENTS.md in this folder. Secrets stay in .env.local.
EOF
}

status() {
  echo "== Claude CLI =="
  if command -v claude >/dev/null; then
    claude --version
    claude auth status || true
  else
    echo "missing: claude"
  fi
  echo
  echo "== Codex CLI (ChatGPT) =="
  if command -v codex >/dev/null; then
    codex --version
    codex login status || true
  else
    echo "missing: codex"
  fi
}

if [[ -z "$WORKER" || "$WORKER" == "-h" || "$WORKER" == "--help" ]]; then
  usage
  exit 1
fi

if [[ "$WORKER" == "status" ]]; then
  status
  exit 0
fi

if [[ -z "$PROMPT" ]]; then
  usage
  exit 1
fi

BOUNDARY="You are a worker in /Users/baltsar/Documents/Cursor/HACKATHON-NETLIGHT.
Read AGENTS.md and stack.json first. Continue from logs/agent.jsonl.
Keep inference on Nebius Token Factory and nvidia/nemotron-3-super-120b-a12b.
Keep a runtime Tavily search AND extract. Do not add SDKs. Plain fetch.
Never commit or print secrets from .env.local.
Product direction: a visual-language director for the first 10 seconds of a hackathon demo, not another GitHub-to-MP4 factory.
Task:
${PROMPT}"

case "$WORKER" in
  claude)
    if ! command -v claude >/dev/null; then
      echo "claude CLI missing" >&2
      exit 1
    fi
    logged="$(claude auth status 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin).get("loggedIn", False))' 2>/dev/null || echo False)"
    if [[ "$logged" != "True" ]]; then
      echo "Claude CLI is not logged in. Run: claude auth login --claudeai" >&2
      exit 2
    fi
    cd "$ROOT"
    exec claude -p \
      --permission-mode bypassPermissions \
      --output-format text \
      "$BOUNDARY" </dev/null
    ;;
  codex)
    if ! command -v codex >/dev/null; then
      echo "codex CLI missing. Symlink: ln -sfn /Applications/Codex.app/Contents/Resources/codex ~/.local/bin/codex" >&2
      exit 1
    fi
    exec codex exec \
      -C "$ROOT" \
      -s workspace-write \
      --approve-for-me \
      --skip-git-repo-check \
      -- "$BOUNDARY" </dev/null
    ;;
  *)
    echo "unknown worker: $WORKER (use claude or codex)" >&2
    exit 1
    ;;
esac
