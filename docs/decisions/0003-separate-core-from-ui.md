# ADR 0003: Separate core logic from the UI

- Status: Accepted
- Date: 2026-07-17

## Decision

Keep project data, WAV parsing, validation, manifests and Roland formats in
packages without React dependencies. Browser `File` objects stay in adapters,
not serialized project models.
