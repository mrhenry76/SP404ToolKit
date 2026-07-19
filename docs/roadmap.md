# Roadmap

## Completed milestones

### Foundation v0.1

Status: complete.

- TypeScript npm-workspaces monorepo and minimal local-first web application
- browser-independent pad model, filename mapping and manifest v1
- defensive RIFF/WAVE parser and reusable validation messages
- automated tests and Linux, macOS and Windows CI
- explicit non-speculative boundary for Roland formats

### Reverse Engineering Lab v0.2

Status: complete.

- deterministic synthetic PCM fixtures and provenance metadata
- read-only WAV inspection and binary comparison tools
- versioned experiment catalog schema and evidence states
- documented controlled-conversion procedures
- no Roland writer

### PAD_INFO Analyzer v0.1

Status: complete.

- exact-size read-only `PAD_INFO.BIN` parser
- A1–J12 record mapping and raw field preservation
- human, JSON and Markdown reporting
- synthetic unit tests and optional private evidence tests
- no serialization, repair or writer

## Next release — reliable SX/A project workflow

The next release remains focused on Roland SP-404SX and SP-404A. Its priorities
are reliability and a complete local project workflow:

- multi-file WAV import;
- explicit A1–J12 assignment and reassignment;
- clear technical and mapping validation;
- portable manifest download and reopen;
- preservation of original audio bytes;
- user-visible consent before any operation that could transform audio.

Compatibility evidence takes priority over feature count.

## Verified Roland export

Roland export can begin only after the relevant fields are supported by
repeatable fixtures, golden-file tests and hardware verification. Candidate
work includes a verified converted-WAV writer, a verified 120-record
`PAD_INFO.BIN` writer and an SD-package builder. None of these writers is
implemented or promised for the next release.

## Future directions

After reliable SP-404SX/SP-404A export is complete and verified, the project may
evaluate optional audio-preparation tools or adapters for other samplers. These
are non-binding directions, not commitments for the first release. Automatic
LUFS normalization, trimming, transformative conversion, AI tagging, required
cloud accounts and a full audio editor are outside the current roadmap.
