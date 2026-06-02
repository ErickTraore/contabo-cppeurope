#!/usr/bin/env bash
set -euo pipefail

# Blocking pre-deploy guard:
# - Enforce clean git tree
# - Enforce expected SHA
# - Enforce critical env-key parity where required

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() { echo -e "${RED}FAIL${NC}: $*"; exit 1; }
warn() { echo -e "${YELLOW}WARN${NC}: $*"; }
pass() { echo -e "${GREEN}PASS${NC}: $*"; }

usage() {
  cat <<'EOF'
Usage: predeploy_guard.sh [options]

Options:
  --repo <path>            Git repository path (default: current directory)
  --expected-sha <sha>     Required commit SHA (short or full). If omitted, origin/main is used
  --allow-untracked        Allow untracked files (still blocks tracked modifications)
  --skip-origin-fetch      Do not run git fetch origin
  -h, --help               Show help

Examples:
  ./scripts/security/predeploy_guard.sh --repo .
  ./scripts/security/predeploy_guard.sh --repo . --expected-sha 3c33b15
EOF
}

REPO="$(pwd)"
EXPECTED_SHA=""
ALLOW_UNTRACKED="false"
SKIP_FETCH="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --expected-sha) EXPECTED_SHA="$2"; shift 2 ;;
    --allow-untracked) ALLOW_UNTRACKED="true"; shift ;;
    --skip-origin-fetch) SKIP_FETCH="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Unknown argument: $1" ;;
  esac
done

[[ -d "$REPO" ]] || fail "Repo path not found: $REPO"
cd "$REPO"

[[ -d .git ]] || fail "Not a git repository: $REPO"

if [[ "$SKIP_FETCH" == "false" ]]; then
  git fetch origin --quiet || fail "Unable to fetch origin"
fi

HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"
ORIGIN_MAIN="$(git rev-parse origin/main 2>/dev/null || true)"
ORIGIN_MAIN_SHORT="$(git rev-parse --short origin/main 2>/dev/null || true)"

if [[ -z "$EXPECTED_SHA" ]]; then
  [[ -n "$ORIGIN_MAIN" ]] || fail "origin/main not found. Provide --expected-sha."
  EXPECTED_SHA="$ORIGIN_MAIN"
fi

EXPECTED_FULL="$(git rev-parse "$EXPECTED_SHA" 2>/dev/null || true)"
[[ -n "$EXPECTED_FULL" ]] || fail "Invalid expected SHA/reference: $EXPECTED_SHA"

STATUS="$(git status --porcelain)"
if [[ -n "$STATUS" ]]; then
  if [[ "$ALLOW_UNTRACKED" == "true" ]]; then
    TRACKED_CHANGES="$(echo "$STATUS" | awk '$1 !~ /^\?\?/ {print}')"
    [[ -z "$TRACKED_CHANGES" ]] || fail "Tracked files modified. Working tree must be clean."
    warn "Untracked files present but allowed by flag --allow-untracked"
  else
    fail "Working tree is not clean. Commit/stash/revert before deploy."
  fi
fi
pass "Working tree clean"

if [[ "$HEAD_SHA" != "$EXPECTED_FULL" ]]; then
  fail "HEAD ($HEAD_SHORT) differs from expected ($(git rev-parse --short "$EXPECTED_FULL"))"
fi
pass "HEAD matches expected SHA: $HEAD_SHORT"

if [[ -n "$ORIGIN_MAIN" ]]; then
  if [[ "$HEAD_SHA" != "$ORIGIN_MAIN" ]]; then
    fail "HEAD ($HEAD_SHORT) differs from origin/main ($ORIGIN_MAIN_SHORT)"
  fi
  pass "HEAD matches origin/main: $ORIGIN_MAIN_SHORT"
fi

# Critical config parity checks (extend as needed)
# Enforce that production public domains are present for presse locale CORS.
PL_ENV="presseLocale-backend/.env.production"
if [[ -f "$PL_ENV" ]]; then
  LINE="$(grep -E '^ALLOWED_ORIGINS=' "$PL_ENV" || true)"
  [[ -n "$LINE" ]] || fail "Missing ALLOWED_ORIGINS in $PL_ENV"
  echo "$LINE" | grep -q 'https://cppeurope.net' || fail "Missing https://cppeurope.net in $PL_ENV ALLOWED_ORIGINS"
  echo "$LINE" | grep -q 'https://www.cppeurope.net' || fail "Missing https://www.cppeurope.net in $PL_ENV ALLOWED_ORIGINS"
  pass "Critical CORS domains present in $PL_ENV"
else
  warn "$PL_ENV not found; skipped critical CORS check"
fi

echo
pass "Pre-deploy guard completed successfully"
