#!/usr/bin/env bash
# Drive the zawlodzki.pl site the way production serves it: the built Astro output
# behind the real Worker (`wrangler dev`, local mode), on a port this run owns.
#
#   web.sh up [--port N] [--no-build]   build apps/web, start wrangler dev, wait until usable
#   web.sh doctor [--port N]            read-only: is this instance ours, current and serving?
#   web.sh probe <path> [--port N] [--label L] [--host H]
#                                       one request, no redirect following; saves headers + body.
#                                       --host sends that Host header (www.zawlodzki.pl = production branch)
#   web.sh shot <path> [--port N] [--label L] [--width W]
#                                       headless Chrome screenshot + rendered DOM (width default 1280)
#   web.sh down [--port N]              stop only the instance this script started
#
# Port defaults to 8790. State lives in $VERIFY_WEB_HOME/runs/<port>/ and is removed by `down`.
# Evidence lives in $VERIFY_WEB_HOME/evidence/<run-id>/ and is never removed by this script.
set -euo pipefail

REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
WEB="$REPO/apps/web"
HOME_DIR="${VERIFY_WEB_HOME:-${TMPDIR:-/tmp}/verify-web}"
HOME_DIR="${HOME_DIR%/}"
PORT=8790
BUILD=1
LABEL=""
HOST_HDR=""
WIDTH=1280

cmd="${1:-}"; shift || true
ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --no-build) BUILD=0; shift ;;
    --label) LABEL="$2"; shift 2 ;;
    --host) HOST_HDR="$2"; shift 2 ;;
    --width) WIDTH="$2"; shift 2 ;;
    *) ARG="$1"; shift ;;
  esac
done

RUN="$HOME_DIR/runs/$PORT"
BASE="http://127.0.0.1:$PORT"

listener_pid() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1; }
our_pids() { [ -f "$RUN/pid" ] && cat "$RUN/pid" || true; }
run_id() { cat "$RUN/run-id" 2>/dev/null || echo "adhoc-$PORT"; }
evidence_dir() { local d="$HOME_DIR/evidence/$(run_id)"; mkdir -p "$d"; echo "$d"; }

# The listener is workerd, a descendant of the wrangler process we started.
owns_port() {
  local lp root p
  lp="$(listener_pid)"; root="$(our_pids)"
  [ -n "$lp" ] && [ -n "$root" ] || return 1
  p="$lp"
  while [ -n "$p" ] && [ "$p" != 1 ]; do
    [ "$p" = "$root" ] && return 0
    p="$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')"
  done
  return 1
}

case "$cmd" in
  up)
    if [ -n "$(listener_pid)" ]; then
      if owns_port; then echo "already up: $BASE (run $(run_id))"; exit 0; fi
      echo "port $PORT is taken by pid $(listener_pid), not by this script. Pick another --port." >&2; exit 1
    fi
    mkdir -p "$RUN"
    id="$(date +%Y%m%d-%H%M%S)-p$PORT"
    echo "$id" > "$RUN/run-id"
    git -C "$REPO" rev-parse --short HEAD > "$RUN/rev"
    if [ "$BUILD" = 1 ]; then
      (cd "$WEB" && pnpm build) > "$RUN/build.log" 2>&1 || { tail -30 "$RUN/build.log" >&2; echo "build failed, log: $RUN/build.log" >&2; exit 1; }
    fi
    [ -f "$WEB/dist/index.html" ] || { echo "no apps/web/dist/index.html; run without --no-build" >&2; exit 1; }
    # nohup + own session so the server outlives the calling shell; inspector on a free port.
    (cd "$WEB" && nohup ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port "$PORT" \
      --inspector-port 0 --persist-to "$RUN/state" --show-interactive-dev-session=false \
      --log-level info > "$RUN/wrangler.log" 2>&1 & echo $! > "$RUN/pid")
    for _ in $(seq 1 60); do
      if grep -q "Ready on" "$RUN/wrangler.log" 2>/dev/null \
        && curl -fsS -o /dev/null "$BASE/" 2>/dev/null; then
        echo "up: $BASE (run $id, rev $(cat "$RUN/rev"), log $RUN/wrangler.log)"
        echo "evidence: $(evidence_dir)"
        exit 0
      fi
      kill -0 "$(our_pids)" 2>/dev/null || { tail -30 "$RUN/wrangler.log" >&2; echo "wrangler exited" >&2; exit 1; }
      sleep 1
    done
    tail -30 "$RUN/wrangler.log" >&2; echo "not ready after 60s; run: $0 down --port $PORT" >&2; exit 1
    ;;

  doctor)
    ok=1
    say() { printf '%-8s %s\n' "$1" "$2"; [ "$1" = FAIL ] && ok=0 || true; }
    if [ -z "$(our_pids)" ]; then say FAIL "no run started by this script on port $PORT ($RUN/pid missing)"; exit 1; fi
    kill -0 "$(our_pids)" 2>/dev/null && say ok "wrangler pid $(our_pids) alive" || say FAIL "wrangler pid $(our_pids) is gone"
    owns_port && say ok "port $PORT is owned by our wrangler" || say FAIL "port $PORT listener ($(listener_pid)) is not ours"
    head_rev="$(git -C "$REPO" rev-parse --short HEAD)"
    [ "$(cat "$RUN/rev")" = "$head_rev" ] && say ok "started at HEAD $head_rev" || say WARN "started at $(cat "$RUN/rev"), HEAD is now $head_rev"
    newer="$(find "$WEB/src" "$WEB/public" "$WEB/astro.config.mjs" -newer "$WEB/dist/index.html" -type f 2>/dev/null | head -3)"
    [ -z "$newer" ] && say ok "dist is newer than src" || say WARN "dist is stale, rebuild (down + up): $newer"
    code="$(curl -s -o "$RUN/doctor-body.html" -w '%{http_code}' "$BASE/" || true)"
    [ "$code" = 200 ] && say ok "GET / -> 200" || say FAIL "GET / -> $code"
    grep -q '<title>Grzegorz Zawłodzki</title>' "$RUN/doctor-body.html" 2>/dev/null \
      && say ok "home page title is this site" || say FAIL "home page title not found; wrong app on this port?"
    [ "$ok" = 1 ] && echo "doctor: healthy ($BASE, run $(run_id))" || { echo "doctor: unhealthy"; exit 1; }
    ;;

  probe)
    [ -n "$ARG" ] || { echo "usage: $0 probe <path> [--port N] [--label L]" >&2; exit 2; }
    ev="$(evidence_dir)"
    slug="${LABEL:-$(printf '%s' "$ARG" | tr -c 'A-Za-z0-9._-' '_')}"
    hdr=(); [ -n "$HOST_HDR" ] && hdr=(-H "Host: $HOST_HDR")
    curl -s ${hdr[@]+"${hdr[@]}"} -D "$ev/$slug.headers" -o "$ev/$slug.body" "$BASE$ARG" \
      -w "%{http_code}|%{redirect_url}|%{content_type}\n" > "$ev/$slug.status"
    IFS='|' read -r code loc ctype < "$ev/$slug.status"
    robots="$(grep -i '^x-robots-tag:' "$ev/$slug.headers" | cut -d' ' -f2- | tr -d '\r' || true)"
    title="$(grep -o '<title>[^<]*</title>' "$ev/$slug.body" | head -1 | sed 's/<[^>]*>//g' || true)"
    line="$(printf '%s\t%s\t%s\t%s\t%s\t%s\t%s' "${HOST_HDR:-127.0.0.1}" "$ARG" "$code" "${loc:--}" "${robots:--}" "${ctype:--}" "${title:--}")"
    [ -f "$ev/probes.tsv" ] || printf 'host\tpath\tstatus\tlocation\tx-robots-tag\tcontent-type\ttitle\n' > "$ev/probes.tsv"
    echo "$line" >> "$ev/probes.tsv"
    echo "$line"
    ;;

  shot)
    [ -n "$ARG" ] || { echo "usage: $0 shot <path> [--port N] [--label L] [--width W]" >&2; exit 2; }
    chrome="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
    [ -x "$chrome" ] || { echo "no Chrome at $chrome; set CHROME_BIN" >&2; exit 1; }
    ev="$(evidence_dir)"
    slug="${LABEL:-$(printf '%s' "$ARG" | tr -c 'A-Za-z0-9._-' '_')}-w$WIDTH"
    prof="$RUN/chrome-profile"; mkdir -p "$prof"
    flags=(--headless=new --disable-gpu --no-first-run --hide-scrollbars --user-data-dir="$prof" --window-size="$WIDTH,900")
    "$chrome" "${flags[@]}" --screenshot="$ev/$slug.png" "$BASE$ARG" > "$RUN/chrome.log" 2>&1
    "$chrome" "${flags[@]}" --dump-dom "$BASE$ARG" > "$ev/$slug.dom.html" 2>> "$RUN/chrome.log"
    [ -s "$ev/$slug.png" ] || { tail -20 "$RUN/chrome.log" >&2; echo "screenshot failed" >&2; exit 1; }
    echo "$ev/$slug.png"
    echo "$ev/$slug.dom.html"
    ;;

  down)
    pid="$(our_pids)"
    if [ -z "$pid" ]; then echo "nothing started by this script on port $PORT"; exit 0; fi
    # kill the wrangler we started and its descendants (workerd), never anything by name
    kids() { local p; for p in $(pgrep -P "$1" 2>/dev/null); do kids "$p"; echo "$p"; done; }
    victims="$(kids "$pid" | tr '\n' ' ')$pid"
    kill $victims 2>/dev/null || true
    for _ in $(seq 1 10); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    kill -9 $victims 2>/dev/null || true
    echo "stopped run $(run_id) (pids $victims); evidence kept in $HOME_DIR/evidence/$(run_id)"
    rm -rf "$RUN"
    ;;

  *) sed -n '2,14p' "$0"; exit 2 ;;
esac
