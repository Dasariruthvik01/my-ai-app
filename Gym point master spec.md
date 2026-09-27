# Gym Point — Consolidated Master Spec

**Status:** Working draft, assembled from the FastAPI backend code + every prior design/spec document reviewed. This supersedes the older ADR's 3-role model and the Node/TS blueprint. Content and behavior only — visual design is a separate, still-open decision (see §10).

---

## 1. Roles & Access Model

Four roles. Each is a tenant-scoped identity — a person operates as exactly one role inside one gym at a time.

| Role | Verification / Onboarding | Landing Screen | Post Rights | Financial Access | Hardware |
|---|---|---|---|---|---|
| **Owner** | Business registration (first entry) | Live Occupancy Dashboard | EVENT, ANNOUNCEMENT, MEDIA, ACHIEVEMENT, CHECK_IN + moderation | Full | Webhook secret + turnstile config |
| **Trainer** | Owner-issued invite PIN (hashed, expiring) | Client roster + Scheduler | Same as Owner minus billing | None | Trainer terminal badge |
| **Worker** | Owner-issued invite PIN | Front-desk / check-in ops screen | None (operational role, not content role) | None | Front-desk scanner terminal |
| **Client** | Gym join code / QR (or Owner/Trainer-issued code) | Today's Workout + Community Feed | ACHIEVEMENT, CHECK_IN only | None | Personal NFC / in-app QR |

**Decided:** the fourth "member-or-client" role is named **Client** everywhere, going forward (older docs and the DB enum in some sources say `MEMBER` — treat that as the same role, renamed).

**Still open:** the Worker role has no invite-token table, RLS policy, or financial/content rule defined anywhere in the source material — it exists in the current backend code and in the B2B_Gym_SaaS design thread, but was never carried into the multi-tenant DB schema or RLS policies below. This needs explicit rules before Worker accounts can be issued safely (see §10, Open Questions).

Self-assignment of elevated roles is impossible. Trainer and Worker accounts are created only via cryptographic invite tokens issued by the Owner. Client accounts join via a gym code/QR.

---

## 2. Multi-Tenant Isolation & Security (implemented, consistent across all sources)

This section matches the live backend code exactly — it's the most solid, unconflicted part of the project.

- **Postgres Row-Level Security** on all sensitive tables (`users`, `attendance_logs`, `machines`, `community_posts`, `daily_todos`). JWT middleware injects `app.current_tenant_id`, `app.current_user_id`, `app.current_user_role` as session variables via `SET LOCAL` before every query.
- `tenant_id` is derived **only** from the verified JWT — never trusted from request body/query.
- `machines` allows `NULL tenant_id` for the global exercise library, alongside gym-custom machines.
- JWT verified on every request: signature, expiry, audience (`jose.jwt.decode`). Expired/invalid tokens → `401` immediately, no partial trust.
- `require_role(*roles)` is composed explicitly per-route. Unknown/missing role claim → fail closed with `403`, never defaulted to lowest privilege.
- Admin-tier routes are Owner-only, enforced by `require_role(Role.OWNER)`, not a manual `if`.
- Security headers on every response (HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`).
- CORS is an explicit per-environment allow-list — never `"*"`.
- `/docs`/`/redoc` disabled when `ENVIRONMENT=production`.
- Catch-all exception handler — client never sees a stack trace or DB error string.
- Secrets loaded from env vars only, with a placeholder guard against deploying with `changeme`-style values.

---

## 3. Authentication & Onboarding

Two flows, now both specified; the first is not yet built, the second (including the bridge between them) has a code skeleton:

1. **First entry (specified, not yet implemented in code):** Google OAuth / Sign in with Apple / Email + 6-digit OTP (60s resend timer) → JWT with `google_id`/`apple_id`/`email`, `is_email_verified`.
2. **Invite/join code entry (implemented):** `POST /verify-pin` — used for Trainer/Worker invite PINs and Client gym-join codes. Defenses: global rate limit (10/min/IP), per-PIN lockout (5 failed attempts → 15 min cooldown, checked *before* running the hash comparison to avoid timing leaks), PIN expiry (72h default), one-time-use option for high-sensitivity flows (e.g., Trainer onboarding), bcrypt hashing at rest, Owner can revoke any PIN instantly with an audit trail.

**Role-claim policy (locked decision):** `POST /claim-role` bridges the two flows, but only for Client. It runs on a deliberately weaker dependency (`verify_pretenant_jwt`) that accepts a token with no tenant_id yet, and re-checks the DB (not just the JWT) so a stale pre-claim token can't be replayed. The request body has no `role` field at all — Client is hardcoded as the only obtainable outcome, so there's no input to tamper with. Owner is never claimed here (verified business registration only, separate flow, not yet built). Trainer/Worker are never claimed here either — invite-PIN only, via `/verify-pin`. Every attempt (success or failure) writes to the audit log; a stale/duplicate claim attempt fails closed with `409`. Skeleton code for `deps.py`, `auth.py`, and a `test_claim_role.py` test scaffold now exist covering this.

**Contract lock:** `/claim-role`'s request body is `{gym_join_code_id, entered_code}` only — no `role`/`requested_role` field, ever, on either side of the API. Any example, tutorial, or generated frontend code that adds one is wrong for this project and should be corrected, not matched.

**Still open:** the actual first-entry OAuth/OTP endpoints themselves (Google/Apple/Email-OTP) still need to be built — `/claim-role` assumes a `PreTenantUser`-shaped JWT already exists by the time it's called. The Supabase Admin API call that actually writes `{tenant_id, role}` into `user_metadata` on a successful claim is also still a placeholder.

---

## 4. Attendance & Check-In

Three entry methods, all tenant-scoped, all logged to `attendance_logs` with **anti-passback**: no second `IN` within 5 minutes for the same user.

- **NFC:** personal NFC tag or Web-NFC tap (Client); trainer/worker terminal badge for staff. Turnstile posts a signed HMAC-SHA256 webhook per tap.
- **QR:** dynamic, rotating in-app QR (prevents screenshot reuse); scanned by a fixed gym scanner or staff phone camera. Fallback when NFC is unavailable.
- **Biometric:** device-level Face ID/fingerprint confirms identity locally, then triggers the same webhook flow. Raw biometric data is never stored or transmitted — only a pass/fail.

Shared behavior: occupancy counter updates in real time over WebSocket after a successful webhook; an `AFTER INSERT` trigger on `attendance_logs` atomically updates `tenants.current_occupancy`. Webhook signatures are verified with `hmac.compare_digest` (constant-time) before the payload is touched; a 5-minute replay window rejects stale/replayed events even if a signature ever leaked.

---

## 5. Community Feed & Moderation

- Feed is strictly tenant-scoped — a Client only ever sees their own gym's activity.
- **Post types by role:** Client → `ACHIEVEMENT`, `CHECK_IN` only. Trainer/Owner → all types (`EVENT`, `ANNOUNCEMENT`, `MEDIA`, `ACHIEVEMENT`, `CHECK_IN`) plus moderation rights.
- `moderation_status` (`VISIBLE` / `FLAGGED` / `REMOVED`) is writable only by Owner/Trainer. Auto-quarantine at `flag_count ≥ 3`.
- Media pipeline: client requests a presigned S3 URL → direct PUT to `tenants/{tenant_id}/posts/{uuid}_{filename}.webp` → CloudFront edge delivery.

---

## 6. AI Coach & Daily To-Dos

- Background jobs generate `daily_todos` rows by matching a Client's goals against available machines (global + tenant-custom).
- Each row carries `target_machine_id`, sets, reps, an AI-generated coaching note. Completion tracked per user per day.
- `POST /generate-workout` is Owner/Trainer only (a Trainer generates/adjusts a plan **for** a Client — always re-verify the target client belongs to the caller's own tenant before generating, never trust a client_id passed in the body alone).
- Rate-limited at 20/hour per IP regardless of role — LLM calls have a direct cost.
- Raw exceptions (e.g., OpenAI key errors) are never surfaced to the client — generic 500 only.

---

## 7. Dashboards (role-specific landing screens)

| Role | Landing dashboard |
|---|---|
| Owner | Live occupancy meter, revenue dashboard (day/week/month toggle, charts), attendance drilldown by name, staff/branch management |
| Trainer | Client roster with quick stats, scheduler, client profile detail (read-only stats/injury notes) |
| Worker | Front-desk check-in queue, equipment maintenance flags, live occupancy (view-only) |
| Client | Today's AI-generated workout target, community feed, check-in card |

---

## 8. Settings vs. Profile (explicit split)

- **Profile = read-only display.** Name, age, role badge, avatar, headline stat row. No inline editing here.
- **Settings = all editable/config items.** Biometrics, height, weight, profile picture, theme/brightness, full attendance history log, notification preferences, account/security, membership pause/transfer (for Client).

---

## 9. Financial & Reports (Owner only)

- Revenue dashboard, day/week/month toggle, charts and trend graphs.
- Downloadable attendance list (CSV/PDF), filterable by date range.
- Attendance drilldown: e.g. "20 of 100 members were absent this week" → list of absent members by name.
- `FINANCE_VIEW_ROLES = {Owner}` in code — Worker and Trainer never see money, matching every source doc.

---

## 10. Open Questions / Decisions Still Needed

1. **Frontend framework** — **decided: React Native + Expo.** Token storage must use `expo-secure-store`, never `AsyncStorage`.
2. **Worker role formalization** — no invite-token table, RLS policy, or explicit content/financial rule exists yet for Worker in the DB schema. Needs the same treatment Trainer already has.
3. **First-entry OAuth/OTP endpoints** — specified but not implemented; needs a `/claim-role` (or equivalent) endpoint to bridge into the existing PIN/JWT system.
4. **Backend tech stack note** — an earlier Node.js/TypeScript blueprint exists in the docs; it's superseded by the real FastAPI/Python implementation. Worth a one-line note in any future ADR revision so no one builds against the old Node version by mistake.
5. **Web vs. Mobile platform split** — each role gets a dedicated Web experience and a dedicated Mobile experience (not a scaled copy of the other) per the Requirements/Priority/Risk doc; exact per-screen split still needs to be finalized once the frontend framework is chosen.

---

## Appendix: Source Map

| Section above | Primary source(s) | Status |
|---|---|---|
| Roles & Access | B2B_Gym_SaaS.pdf, live code (`security.py`, `deps.py`) | Authoritative |
| Multi-tenant security | `deps.py`, `security.py`, `webhooks.py`, `pin_service.py`, `SECURITY.md`, ADR §ADR-01/03/08 | Authoritative — matches code |
| Auth/onboarding | First_Entry_Auth_Specification.pdf, `auth.py`, `pin_service.py` | Partially implemented |
| Attendance | Gym_Point_Requirements_Priority_Risk.pdf, `webhooks.py`, ADR §ADR-03 | Authoritative |
| Community feed | mvp.pdf, ADR §ADR-04 | Authoritative |
| AI Coach | ADR §ADR-05, `ai.py` | Authoritative |
| Dashboards / Settings split | Gym_Point_Full_Spec.pdf, AI_BUILD_BRIEF_GYM_POINT_FRAMER_TEMPLATE.md | Authoritative for content; visual TBD |
| Financial | Gym_Point_Full_Spec.pdf, `security.py` (`FINANCE_VIEW_ROLES`) | Authoritative |

Documents treated as historical brainstorming, not current spec: `Analyzing_Inaccessible_Grok_Project_Data`, both `Branch___...` files, `Backend_Architecture_for_Dynamic_UI`, `Combining_UI_Design_Prompts`, `Decoding_Modern_Spatial_UI_Design`, `Tailwind_CSS_Landing_Page_Recreation`, `UI_UX_Design_Trends_Breakdown`, `Fitness_App_UI_Wireframe_Breakdown`, `Framer_Portfolio_Layout_and_Styling_Guide`, the `Gym_App_Licence` chain, the Node/TS `Comprehensive_Technical_Blueprint`, and the old 3-role ADR (role model only — its security architecture in §2 above is otherwise sound and retained).
