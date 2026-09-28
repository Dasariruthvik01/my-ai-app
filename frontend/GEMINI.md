# frontend/GEMINI.md — Antigravity, frontend workspace

Read `/AGENTS.md` first — this file only adds frontend-specific detail on
top of it. Do not repeat or contradict the guardrails there.

## Recommended autonomy profile
**Review-driven development** for anything that touches an auth screen,
a form that submits to a protected endpoint, or token storage. **Agent-
driven development** is fine for pure layout/visual work (portfolio-style
screens, static content) once a screen has no auth surface.

## Visual replication workflow
1. Wait for the labeled inspiration image for the screen you're building —
   don't invent a layout ahead of it.
2. Build against `/contracts/openapi.json` for any data the screen needs —
   never assume a field name or response shape.
3. Run your visual-verification loop against the reference image before
   opening a PR.
4. If the screen needs something the backend doesn't expose yet, write it
   to `/handoff/backend-requests.md` and build against a mock **only
   inside `frontend/services/mock/`**, behind a single `USE_MOCK_API`
   switch in `frontend/services/api.*`. Mocks must mirror
   `/contracts/openapi.json` exactly (same field names, same error
   statuses). Never scatter hardcoded fake data through screens or
   components, and never mock auth in a way that lets a screen appear
   "logged in" without a token from the real flow — mock auth returns a
   clearly labeled dev-only token that is rejected outright when
   `USE_MOCK_API` is off.

## Non-negotiable, frontend-specific
- **Token storage:** use `expo-secure-store` (backed by iOS Keychain /
  Android Keystore), never `AsyncStorage` and never plain React state
  persisted to disk. `AsyncStorage` is unencrypted on-device storage — an
  access/refresh token sitting there is readable by anything with
  filesystem access on a rooted/jailbroken device. This applies to every
  token this app issues (post-`/verify-pin`, post-`/claim-role`, and
  whatever the eventual OAuth/OTP flow issues).
- The four roles (Owner, Trainer, Worker, Client) each get their own
  landing screen (see `Gym_Point_Master_Spec.md` §7) — don't build a
  single generic dashboard and branch content client-side only; role-
  gating still has to be enforced server-side regardless of what the UI
  shows or hides.
- Worker's role in the UI is intentionally invite-only and not
  self-selectable — no onboarding screen should list Worker as a pickable
  option (see root file §3).

## Exact contract for /claim-role — don't improvise this one
Request body is `{"gym_join_code_id": string, "entered_code": string}`
only. **Never add a `role` or `requested_role` field** — the backend
hardcodes Client server-side on purpose, and a request-body role field
(even one that only ever sends `"client"` today) is exactly the pattern
that was deliberately designed out. If a generic tutorial or example
elsewhere shows a role field on this endpoint, it's wrong for this project
— match `/contracts/openapi.json` instead.

## Pending, not yet locked
- Design tokens (`/contracts/design-tokens.*`) — don't hardcode a
  permanent palette/spacing system until this file exists.
- Frontend framework itself is still being decided — keep components as
  framework-idiomatic as possible rather than over-abstracting for a
  hypothetical swap.
