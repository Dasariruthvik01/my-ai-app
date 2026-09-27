# Handoff Changelog

## [1.0.0] - Authentication & Role Claiming Initial Setup
- Added /api/v1/auth/request-otp for Email-OTP generation.
- Added /api/v1/auth/verify-otp returning pre-tenant JWT tokens.
- Added /api/v1/auth/claim-role restricting self-service onboarding strictly to the client role via gym join codes.
