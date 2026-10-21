#!/bin/bash
# Setup script for the Claude Code cloud environment (claude.ai/code).
# Paste this file's contents into the environment's "Setup script" field.
# It runs as root on Ubuntu 24.04 before Claude Code starts, and its result
# is snapshotted for about seven days. Project dependencies are installed by
# the SessionStart hook in .claude/hooks/cloud-session-start.sh instead.
set -euo pipefail

# Node 24 to match CI (.github/workflows/ci.yml). The image ships Node 22.
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 24 ]; then
  npm install -g n
  n 24
  hash -r
fi

# pnpm version pinned in package.json "packageManager".
npm install -g pnpm@12.14.0

# Chromium for the verify-web skill's screenshots (CHROME_BIN).
npx -y playwright@1 install --with-deps chromium
ln -sf "$(find /root/.cache/ms-playwright -path '*chrome-linux*/chrome' -type f | head -1)" /usr/local/bin/chromium

node -v
pnpm -v
python3 --version
chromium --version
