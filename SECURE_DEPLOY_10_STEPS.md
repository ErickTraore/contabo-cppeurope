# Secure Deploy 10 Steps

This checklist enforces one source of truth and blocks unsafe releases.

1. Update local repository and verify branch
- Run: `git fetch origin && git checkout main && git pull --ff-only`

2. Ensure clean workspace before release
- Run: `git status --short`
- Must be empty (or abort release).

3. Run blocking pre-deploy guard
- Run: `./scripts/security/predeploy_guard.sh --repo .`
- This blocks on dirty tree, SHA mismatch, or missing critical CORS domains.

4. Build once, promote same artifact
- Build one immutable artifact tagged by commit SHA.
- Do not rebuild separately for staging and production.

5. Deploy to staging only from approved SHA
- Record SHA in release notes.
- Reject manual file edits on the server.

6. Execute functional gate on staging
- Validate create/consult for both modules and all 4 formats.
- Block promotion if any case fails.

7. Promote exact same SHA to production
- No source changes between staging and production.

8. Run drift audit immediately after deployment
- Run: `./scripts/security/drift_audit.sh --repo .`
- In strict mode: `./scripts/security/drift_audit.sh --repo . --strict`

9. Save release manifest
- Store date, operator, commit SHA, service versions, and critical env hashes.

10. Enforce rollback readiness
- Keep previous artifact SHA and rollback command prepared.
- If drift or failure appears, rollback immediately to the last known good SHA.

## Notes
- Avoid direct server edits outside approved emergency workflow.
- If emergency hotfix is unavoidable, backport to git and redeploy from that SHA immediately.
