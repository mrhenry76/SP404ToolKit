# Architecture

## Product boundary

SP404 Toolkit is a local-first application for preparing projects for the
Roland SP-404SX and SP-404A. The first release remains intentionally limited to
those targets. Files are processed locally, no account is required, and no
operation changes audio without explicit user consent.

## Module boundaries

The repository is an npm-workspaces monorepo. Each module has one narrow role:

| Module | Owns | Must not own |
|---|---|---|
| `core` | Serializable domain types, pad model and mapping utilities | Browser objects, UI code or Roland binary details |
| `wav` | Defensive RIFF/WAVE parsing and access to unchanged PCM data | UI code or Roland-specific assumptions |
| `manifest` | Portable manifest schema and JSON validation | Audio bytes or browser objects |
| `validator` | Structured technical and pad-mapping messages | UI rendering or automatic correction |
| `roland-sp404sx` | Boundary for future, verified Roland output | Speculative fields, unverified writers or UI code |
| `reverse-engineering-lab` | Synthetic fixtures, binary comparison and read-only experimental analysis | Production writers or semantic claims unsupported by evidence |
| `pad-info` | Read-only decoding and reporting for `PAD_INFO.BIN` | Serialization, normalization, repair or Roland writers |
| `web` | Browser adapters and presentation | Binary format implementation |

Dependencies point toward the small central model rather than toward the UI.
Roland binary structures stay outside `core`, and browser `File` objects or
other browser handles stay outside serializable project data.

## Current data flow

1. The browser adapter receives user-selected local WAV files.
2. `wav` reads structure, metadata and PCM bytes without altering them.
3. `core` maps samples to the A1–J12 pad model.
4. `validator` returns structured technical and mapping messages.
5. `manifest` reads and writes a portable project description.
6. `web` presents the results and keeps browser-only objects at the edge.

`reverse-engineering-lab` and `pad-info` are diagnostic, evidence-gathering
components. They do not produce Roland files. No `RLND` or `PAD_INFO.BIN`
writer is implemented.

## Future audio processing

A generic Audio Engine may be considered after the reliable SP-404SX/SP-404A
workflow is complete. It is not part of the current implementation. Any future
normalization, trimming, channel conversion or other transformative operation
must be optional, previewable and initiated with explicit user consent. Source
audio must never be changed silently.

## Compatibility policy

Compatibility claims require repeatable fixtures, automated tests and hardware
verification. Support for other samplers remains a possible future direction,
not part of the first release architecture.
