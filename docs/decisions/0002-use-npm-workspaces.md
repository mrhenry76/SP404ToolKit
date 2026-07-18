# ADR 0002: Use npm workspaces

- Status: Accepted for Foundation v0.1
- Date: 2026-07-17

## Decision

Use npm workspaces rather than adding pnpm as a prerequisite. The module
boundaries are useful now, while npm keeps onboarding simple for a user who is
installing Node for the first time. This can be revisited if workspace scale or
performance provides concrete reasons.
