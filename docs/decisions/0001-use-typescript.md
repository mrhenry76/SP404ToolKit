# ADR 0001: Use TypeScript

- Status: Accepted
- Date: 2026-07-17

## Decision

Use strict TypeScript for shared logic, the web app and tests. Binary parsers
use `Uint8Array` and `DataView` and remain independent of browser UI types.
