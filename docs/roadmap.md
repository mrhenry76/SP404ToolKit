# Roadmap

## Foundation v0.1 — current

- TypeScript monorepo and minimal web app
- WAV parser, pad model, filename mapping and manifest v1
- automated tests and three-platform CI
- documentation and non-speculative Roland boundary

Status: complete. Local verification and the Linux/macOS/Windows CI matrix are
green.

## Reverse Engineering Lab v0.2 — prepared

- deterministic synthetic fixtures and provenance records
- WAV structure inspection and byte-difference tooling
- controlled `RLND` and `PAD_INFO.BIN` experiment matrices
- explicit evidence promotion from `UNKNOWN`/`OBSERVED` to `CONFIRMED`
- SP-404SX hardware verification baseline

No Roland writer is included. See
[`milestones/reverse-engineering-lab-v0.2.md`](milestones/reverse-engineering-lab-v0.2.md).

## Milestone 1 — WAV import and pad mapping

- multi-file drag and drop
- interactive A1–J12 mapping
- complete technical validation
- manifest download and reopen

## Milestone 2 — Roland WAV converter

- verified `RLND` writer
- PCM offset and naming rules
- golden files and hardware verification

## Milestone 3 — `PAD_INFO.BIN`

- verified 120-record writer
- occupied and empty records
- multi-pad tests and hardware verification

## Milestone 4 — SD package builder

- complete folder structure and ZIP output
- reporting, backup and experimental direct writing

## Milestone 5 — public beta

- PWA/offline support, user documentation and cross-browser testing
