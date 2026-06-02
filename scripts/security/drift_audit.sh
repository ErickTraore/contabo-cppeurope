#!/usr/bin/env bash
set -euo pipefail

# Drift audit (repo + remote server + runtime env)
# Returns non-zero when critical drift is detected.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT+1)); echo -e "${GREEN}PASS${NC}: $*"; }
warn() { WARN_COUNT=$((WARN_COUNT+1)); echo -e "${YELLOW}WARN${NC}: $*"; }
fail() { FAIL_COUNT=$((FAIL_COUNT+1)); echo -e "${RED}FAIL${NC}: $*"; }

usage() {
  cat <<'EOF'
Usage: drift_audit.sh [options]

Options:
  --repo <path>            Local git repository path (default: current directory)
  --host <user@host>       SSH target (default: root@62.171.186.233)
  --strict                 Treat warnings as failures
  --skip-remote            Run local-only checks
  -h, --help               Show help

Examples:
  ./scripts/security/drift_audit.sh --repo .
  ./scripts/security/drift_audit.sh --repo . --strict
EOF
}

REPO="$(pwd)"
HOST="root@62.171.186.233"
STRICT="false"
SKIP_REMOTE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    --strict) STRICT="true"; shift ;;
    --skip-remote) SKIP_REMOTE="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

[[ -d "$REPO" ]] || { echo "Repo not found: $REPO"; exit 1; }
cd "$REPO"

if [[ -d .git ]]; then
  git fetch origin --quiet || warn "Unable to fetch origin"
  HEAD="$(git rev-parse --short HEAD)"
  ORIGIN_MAIN="$(git rev-parse --short origin/main 2>/dev/null || true)"
  STATUS="$(git status --porcelain)"

  if [[ -z "$STATUS" ]]; then
    pass "Local working tree is clean"
  else
    fail "Local working tree is dirty"
    echo "$STATUS"
  fi

  if [[ -n "$ORIGIN_MAIN" && "$HEAD" == "$ORIGIN_MAIN" ]]; then
    pass "Local HEAD matches origin/main ($HEAD)"
  else
    fail "Local HEAD ($HEAD) differs from origin/main (${ORIGIN_MAIN:-unknown})"
  fi
else
  fail "Local path is not a git repository"
fi

EXPECTED_SHA="${ORIGIN_MAIN:-$HEAD}"

if [[ "$SKIP_REMOTE" == "false" ]]; then
  REMOTE_OUT="$(ssh "$HOST" 'set -e
# 1) Check git drift in /var/www/cppeurope if present
if [ -d /var/www/cppeurope/.git ]; then
  cd /var/www/cppeurope
  echo "REMOTE_GIT_HEAD=$(git rev-parse --short HEAD)"
  if [ -n "$(git status --porcelain)" ]; then
    echo "REMOTE_GIT_DIRTY=1"
  else
    echo "REMOTE_GIT_DIRTY=0"
  fi
else
  echo "REMOTE_GIT_HEAD=NA"
  echo "REMOTE_GIT_DIRTY=NA"
fi

# 2) Stacks without git are deployment-risk indicators
for d in /opt/contabo-cppeurope/presseLocale-backend /opt/contabo-cppeurope/presseGenerale-backend /opt/contabo-cppeurope/mediaLocale-backend /opt/contabo-cppeurope/mediaGle-backend /opt/contabo-cppeurope/staging-compose-media-locale-ump; do
  if [ -d "$d/.git" ]; then
    echo "STACK_STATUS:$d:git"
  else
    if [ -f "$d/.release-sha" ]; then
      lock_sha="$(tr -d " \n\r\t" < "$d/.release-sha" 2>/dev/null || true)"
      echo "STACK_STATUS:$d:locked:$lock_sha"
    else
      echo "STACK_STATUS:$d:unmanaged"
    fi
  fi
done

# 3) Critical runtime config parity for presse locale CORS
PROD_FILE="/opt/contabo-cppeurope/presseLocale-backend/.env.production"
STG_FILE="/opt/contabo-cppeurope/presseLocale-backend/.env.staging"
PROD_FILE_ORIGINS="$(grep -E "^ALLOWED_ORIGINS=" "$PROD_FILE" 2>/dev/null || true)"
STG_FILE_ORIGINS="$(grep -E "^ALLOWED_ORIGINS=" "$STG_FILE" 2>/dev/null || true)"
PROD_RT_ORIGINS="$(docker exec presselocale-backend-presseLocale-backend-1 printenv | grep "^ALLOWED_ORIGINS=" 2>/dev/null || true)"
STG_RT_ORIGINS="$(docker exec staging-presse-locale-presseLocale-backend-1 printenv | grep "^ALLOWED_ORIGINS=" 2>/dev/null || true)"

echo "PROD_FILE_ORIGINS=$PROD_FILE_ORIGINS"
echo "STG_FILE_ORIGINS=$STG_FILE_ORIGINS"
echo "PROD_RT_ORIGINS=$PROD_RT_ORIGINS"
echo "STG_RT_ORIGINS=$STG_RT_ORIGINS"
' 2>/dev/null || true)"

  if echo "$REMOTE_OUT" | grep -q 'REMOTE_GIT_DIRTY=1'; then
    fail "Remote /var/www/cppeurope is dirty"
  elif echo "$REMOTE_OUT" | grep -q 'REMOTE_GIT_DIRTY=0'; then
    pass "Remote /var/www/cppeurope is clean"
  else
    warn "Remote git workspace not found or not readable"
  fi

  STACK_LINES="$(echo "$REMOTE_OUT" | grep '^STACK_STATUS:' || true)"
  if [[ -z "$STACK_LINES" ]]; then
    fail "No stack status returned by remote check"
  else
    while IFS= read -r line; do
      [[ -n "$line" ]] || continue
      dir="$(echo "$line" | cut -d: -f2)"
      mode="$(echo "$line" | cut -d: -f3)"
      if [[ "$mode" == "git" ]]; then
        pass "Stack is git-backed: $dir"
      elif [[ "$mode" == "locked" ]]; then
        lock_sha="$(echo "$line" | cut -d: -f4)"
        if [[ -n "$lock_sha" && "$lock_sha" == "$EXPECTED_SHA" ]]; then
          pass "Gitless stack locked to expected SHA ($EXPECTED_SHA): $dir"
        else
          fail "Gitless stack lock mismatch at $dir (expected $EXPECTED_SHA, got ${lock_sha:-empty})"
        fi
      else
        fail "Unmanaged gitless stack (missing .release-sha): $dir"
      fi
    done <<< "$STACK_LINES"
  fi

  PROD_FILE_ORIGINS="$(echo "$REMOTE_OUT" | grep '^PROD_FILE_ORIGINS=' | sed 's/^PROD_FILE_ORIGINS=//')"
  PROD_RT_ORIGINS="$(echo "$REMOTE_OUT" | grep '^PROD_RT_ORIGINS=' | sed 's/^PROD_RT_ORIGINS=//')"
  STG_FILE_ORIGINS="$(echo "$REMOTE_OUT" | grep '^STG_FILE_ORIGINS=' | sed 's/^STG_FILE_ORIGINS=//')"
  STG_RT_ORIGINS="$(echo "$REMOTE_OUT" | grep '^STG_RT_ORIGINS=' | sed 's/^STG_RT_ORIGINS=//')"

  if [[ -n "$PROD_FILE_ORIGINS" && "$PROD_FILE_ORIGINS" == "$PROD_RT_ORIGINS" ]]; then
    pass "Prod CORS origins file/runtime aligned"
  else
    fail "Prod CORS origins drift (file vs runtime)"
    echo "file:    $PROD_FILE_ORIGINS"
    echo "runtime: $PROD_RT_ORIGINS"
  fi

  if [[ -n "$STG_FILE_ORIGINS" && "$STG_FILE_ORIGINS" == "$STG_RT_ORIGINS" ]]; then
    pass "Staging CORS origins file/runtime aligned"
  else
    fail "Staging CORS origins drift (file vs runtime)"
    echo "file:    $STG_FILE_ORIGINS"
    echo "runtime: $STG_RT_ORIGINS"
  fi
fi

echo
printf 'Summary: PASS=%s WARN=%s FAIL=%s\n' "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"

if [[ "$STRICT" == "true" && "$WARN_COUNT" -gt 0 ]]; then
  echo "Strict mode: warnings are treated as failures"
  exit 1
fi

[[ "$FAIL_COUNT" -eq 0 ]]
