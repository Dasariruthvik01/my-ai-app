## Review checklist (run on every PR)

1. Any request-body field that sets or implies a role (must never exist)
2. tenant_id read from anything other than the verified JWT
3. Routes missing require_role, or manual role `if` checks
4. Tokens stored anywhere except expo-secure-store
5. Logged secrets, PINs or tokens; raw exceptions returned to clients
6. SQLite or any non-Postgres DB use
7. Mock data outside frontend/services/mock/ or USE_MOCK_API bypasses
8. Edits outside the agent's owned directory
   Report findings as: file, line, severity, why it matters. Do not fix anything.
