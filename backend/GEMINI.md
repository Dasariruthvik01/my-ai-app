# backend/GEMINI.md — Gemini CLI, backend workspace

Read `/AGENTS.md` first — this file only adds backend-specific detail on
top of it. Do not repeat or contradict the guardrails there.

## Recommended autonomy profile
**Review-driven development** (checkpoints before applying changes), not
agent-driven/autonomous mode. This codebase already handles multi-tenant
auth, PIN hashing, and hardware webhook signatures — mistakes here are
expensive, not just annoying. Use Secure mode for anything touching
`/backend/app/core/security.py`, `/backend/app/api/deps.py`, or
`/backend/app/services/pin_service.py` specifically.

## Existing patterns to follow, not reinvent
- `deps.py` — `verify_supabase_jwt` (full auth) vs `verify_pretenant_jwt`
  (narrow, pre-tenant, used only by `/claim-role`). If you need a new kind
  of "partially authenticated" state, follow this same pattern: a distinct
  return type, not a `CurrentUser` with a null field standing in for
  "not really authenticated yet."
- `require_role(*roles)` — every protected route composes this explicitly.
  Don't add a manual `if current_user.role == ...` check as a shortcut.
- `pin_service.py` — `is_locked_out()` is checked **before** `verify_pin()`
  runs, every time. Preserve that order in any new PIN/code-style flow —
  checking lockout after the hash comparison leaks timing information.
- `admin.py` / `auth.py` — the `audit_log.info(..., extra={...})` calls
  never include secret values, only identifiers + action. Match this shape
  for any new sensitive action.

## Known open gaps (from the master spec) — build these next, in this order
1. First-entry OAuth/Email-OTP endpoints (Google, Apple, Email+OTP) —
   these don't exist yet; `/claim-role` assumes they've already run.
2. The real Supabase Admin API call inside `/claim-role` that writes
   `{tenant_id, role: "client"}` to `user_metadata` — currently a
   placeholder comment.
3. Worker role formalization — invite-token table + RLS policy. Worker
   currently has no defined content/financial rule; don't invent one
   without checking `Gym_Point_Master_Spec.md` §10 first.

## Do not
- Do not weaken `verify_supabase_jwt` to make `verify_pretenant_jwt`'s job
  easier — they're deliberately separate functions for a reason (see §3
  of the root file).
- Do not add a role value beyond Owner/Trainer/Worker/Client anywhere.
- Do not commit real secrets to any `.env.example` — placeholder values
  only, and `config.py`'s placeholder guard should keep rejecting them.
- **Do not add a `role` or `requested_role` field to `ClaimRoleRequest`,
  ever, even if a frontend snippet or generic tutorial shows one.** The
  real contract is `{gym_join_code_id, entered_code}` only. Role is
  hardcoded to Client server-side specifically so no request body field
  can grant an elevated role. If you see a frontend call sending
  `requested_role`, that's the frontend's mistake — flag it via
  `/handoff/backend-requests.md`, don't add a matching field to accept it.
- Do not use SQLite, in local dev or anywhere else. The tenant-isolation
  model (ADR-01) depends on Postgres Row-Level Security, which SQLite
  doesn't have. Local dev runs against a real (Dockerized is fine)
  Postgres instance from the start.
