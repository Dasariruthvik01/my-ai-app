# Gym Point — Project Status

Snapshot of where the project stands after the planning and setup work
done with Claude. Update this file when a decision changes.

## Decisions locked

- **Roles (4):** Owner, Trainer, Worker, Client. "Client" is the standard name (older docs say "Member").
- **Backend:** FastAPI/Python on **Postgres with Row-Level Security** (no SQLite). Node/TS blueprint is superseded.
- **Frontend:** React Native + Expo. Tokens stored with `expo-secure-store`, never `AsyncStorage`.
- **Approach:** frontend first against a mock layer (`frontend/services/mock/`, one `USE_MOCK_API` switch), then connect real endpoints one by one.
- **Agents:** Gemini CLI builds `/backend`; Antigravity builds `/frontend`; Claude Code reviews both (read-only).
- **Onboarding:** `/claim-role` lets a user self-claim **Client only**, via a gym join code. Owner = verified business registration only; Trainer/Worker = Owner-issued invite PINs. Request body is `{gym_join_code_id, entered_code}` only, never a role field.

## Done

- Consolidated master spec (`Gym_Point_Master_Spec.md`)
- `/claim-role` endpoint skeleton, `verify_pretenant_jwt`, and `test_claim_role.py` scaffold (DB and Supabase calls are still placeholders)
- Agent instruction files: `AGENTS.md`, `backend/GEMINI.md`, `frontend/GEMINI.md`
- Repo pushed to GitHub with instruction files and the Expo scaffold

## Repo cleanup still to do

- Remove duplicate `frontend/Agents.md` (case clash with `AGENTS.md`)
- Rename `frontend/frontend_GEMINI.md` to `frontend/GEMINI.md`, and confirm it includes `USE_MOCK_API` and `expo-secure-store`
- Make `frontend/CLAUDE.md` an import pointer to `AGENTS.md` and `GEMINI.md`, and add the review checklist
- Search `frontend/services/api.js` for `requested_role` and remove it

## Next steps (in order)

1. Upload the labeled inspiration images, then create the design tokens and screen list
2. Generate `contracts/openapi.json` from the FastAPI app
3. Build frontend screens against mocks: sign-in, role choice (Worker hidden), join code, then Client, Trainer, Worker, Owner screens
4. Backend: first-entry OAuth/Email-OTP endpoints (not built yet)
5. Backend: real Supabase Admin API call inside `/claim-role`
6. Backend: Worker role invite table and RLS policy
7. Add CI: `pip-audit`, `npm audit`, a static scanner, and the test suite
8. Swap mocks for real endpoints one at a time, with Claude Code review on each PR

## Open items (from `SECURITY.md`)

- MFA for Owner accounts
- Token revocation / "logout everywhere"
- Real production CORS domains
- OWASP API Top 10 pass before handling payments

## Later: launch

Domain, Apple Developer ($99/yr) and Google Play ($25 one-time) accounts, backend hosting, App Store and Play Store submission (Sign in with Apple is required if other social logins are offered).
