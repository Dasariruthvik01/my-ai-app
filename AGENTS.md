# Gym Point — Agent Instructions (root)

Read this before doing anything. Both agents on this project load this file:
Gemini CLI and Google Antigravity both resolve AGENTS.md at the repo root.

Full context: Gym_Point_Master_Spec.md at the repo root is the canonical spec.

## 1. Project shape
Multi-tenant fitness-gym SaaS.
Roles: Owner, Trainer, Worker, Client.

## 2. Directory ownership
- /backend -> Gemini CLI
- /frontend -> Antigravity
- /AGENTS.md, contracts/* -> Shared, read-only

## 3. Non-negotiable guardrails
- Never read, edit, print, or export .env or secret keys.
- tenant_id is derived only from verified JWT, never request bodies.
- Fail closed always on unknown roles or invalid tokens.
- Client is the only self-service role. Worker is invite-only.
