# Gym Point — Agent Instructions (root)

Read this before doing anything. Both agents on this project load this file:
Gemini CLI and Google Antigravity both resolve `AGENTS.md` at the repo root.
Directory-specific `GEMINI.md` files add tool-specific detail on top of this
— they never override the guardrails in §3 below.

Full context: `Gym_Point_Master_Spec.md` at the repo root is the canonical
spec (roles, features, screens, architecture). If anything here conflicts
with it, the master spec wins and this file is out of date — flag it,
don't silently pick one.

## 1. Project shape

Multi-tenant fitness-gym SaaS. Backend: FastAPI/Python (already has real,
working code — this is not a greenfield backend), **database is Postgres,
not SQLite** — the tenant-isolation model (ADR-01) is built on Postgres
Row-Level Security, which SQLite has no equivalent for. Local dev runs
against a real Postgres instance (Docker is fine) from day one.

Frontend: **React Native + Expo** (locked decision, not Flutter). Treat
`/frontend` as its own workspace with its own package.json/dependencies.

Local dev, once both sides are running: FastAPI typically on `:8000`
(interactive docs at `:8000/docs` outside production), Expo dev server
typically on `:8081` (web) / via Expo Go or a simulator for native.

Four roles, tenant-scoped, name locked: **Owner, Trainer, Worker, Client**
(not "Member" — older docs use that name for the same role as Client).

## 2. Directory ownership — do not cross this line

| Directory | Owned by | Rule |
|---|---|---|
| `/backend` | Gemini CLI | Antigravity never edits files here. If a UI screen needs a backend change, write the request to `/handoff/backend-requests.md` instead of editing directly. |
| `/frontend` | Antigravity | Gemini CLI never edits files here. |
| `/AGENTS.md`, `Gym_Point_Master_Spec.md`, `/contracts/*` | Shared, read-only to both agents | Neither agent edits these directly — a human updates them when a decision changes. |
| Whole repo (read-only) | Claude Code — **Reviewer** | Reviews diffs and pull requests from Gemini CLI and Antigravity against the checklist in `CLAUDE.md`. Reports findings (file, line, severity, why) and never edits application code. Never reads `.env` or secret files. |

Builders never merge their own work to `main`: every change goes through a
branch and a review pass first.

## 3. Non-negotiable guardrails (apply regardless of which agent is running)

- **Never read, edit, print, or export:** `.env`, any `config.py` secret value, the Supabase service-role key, per-tenant webhook HMAC secrets. If a task seems to require touching one of these, stop and ask a human instead of finding a workaround.
- **Tenant scoping:** `tenant_id` is derived only from a verified JWT, never from a request body, query param, or anything client-supplied. This is enforced in Postgres RLS too — don't add a code path that bypasses it "just this once."
- **Fail closed, always:** an unknown/missing role, an expired/invalid token, or a lookup that returns nothing → reject with an explicit error status. Never default to the lowest-privilege role, never default to "allow," never swallow the error and continue.
- **No self-assignable elevated roles:** Client is the only role obtainable through self-service (via `/claim-role` + a gym join code). Owner requires verified business registration (separate flow). Trainer/Worker are invite-PIN only, issued by an Owner. No request field, flag, or endpoint may grant Trainer/Worker/Owner from user input.
- **Secrets/PINs are hashed at rest** (bcrypt) and rate-limited on verification (global per-IP limit + per-code lockout after repeated failures). Never log a raw PIN, token, or webhook secret value — only identifiers and the action taken, via the `audit_log` logger already established in `admin.py`/`auth.py`.
- **Never surface raw exceptions** (stack traces, DB errors, internal paths) to a client response — generic message to the caller, full detail to server logs only.

## 4. Shared contract (both agents read from here, neither invents their own copy)

- **API contract:** `/contracts/openapi.json` — generated from the real FastAPI routes (`/api/v1/openapi.json` when the backend is running). Antigravity builds UI calls against this file, not against assumptions about endpoint shape.
- **Design tokens:** `/contracts/design-tokens.*` — locked once the frontend framework and inspiration images are finalized. Until that file exists, Antigravity should not invent a permanent color/spacing system — flag it as pending rather than guessing.

## 5. Handoff protocol

If Gemini CLI changes an API shape (new field, new endpoint, changed error code), it updates `/contracts/openapi.json` generation and adds a one-line note to `/handoff/changelog.md`. If Antigravity needs something from the backend that doesn't exist yet, it writes the request to `/handoff/backend-requests.md` and builds against the isolated mock layer described in `frontend/GEMINI.md` (`frontend/services/mock/`, behind one `USE_MOCK_API` switch, mirroring `/contracts/openapi.json` exactly). It does not invent an endpoint shape and scatter fake data through screens.
