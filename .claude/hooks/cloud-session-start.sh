#!/bin/bash
# SessionStart hook for Claude Code cloud sessions. Does nothing locally.
# Installs workspace dependencies and fetches the private inventory clone.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then exit 0; fi
set -uo pipefail
cd "$CLAUDE_PROJECT_DIR" || exit 0

# Reinstall only when the lockfile changed since the last install.
stamp=node_modules/.lockfile.sha
hash=$(sha256sum pnpm-lock.yaml | cut -d' ' -f1)
if [ "$(cat "$stamp" 2>/dev/null)" != "$hash" ]; then
  pnpm install --frozen-lockfile && echo "$hash" > "$stamp"
fi

# Private inventory (see AGENTS.md "Inventory"). Works only when the session
# has access to zawlodzki/nowa-strona-grzesiek-inventory. Never fatal.
inv=migration/00-inventory
if [ -d "$inv/.git" ]; then
  git -C "$inv" pull --ff-only -q || echo "inventory: pull failed"
else
  git clone -q https://github.com/zawlodzki/nowa-strona-grzesiek-inventory.git "$inv" \
    || echo "inventory: no access, tasks marked (needs inventory) are unavailable"
fi

python3 -I migration/tools/tasks.py check || true
exit 0
