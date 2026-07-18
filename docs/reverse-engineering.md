# Reverse-engineering register

Status vocabulary:

- **CONFIRMED**: supported by repeatable evidence and accepted project fixtures
- **OBSERVED**: present in available examples but not sufficiently varied
- **HYPOTHESIS**: an explanation awaiting controlled tests
- **UNKNOWN**: not yet established

No Roland binary writer may promote `OBSERVED`, `HYPOTHESIS`, or `UNKNOWN`
values to fixed behavior without tests and review.

## Converted WAV

The foundational research reports the following. These items must still be
represented by redistributable project fixtures before writer implementation.

| Status | Observation |
|---|---|
| OBSERVED | Container remains RIFF/WAVE |
| OBSERVED | Chunk order is `fmt `, `RLND`, `data` |
| OBSERVED | `RLND` payload size is 458 bytes |
| OBSERVED | PCM begins at absolute offset 512 |
| OBSERVED | `fmt ` payload size is 18 bytes |
| UNKNOWN | Meaning of every `RLND` field |
| UNKNOWN | Mono/stereo-dependent values |
| UNKNOWN | Duration-, rate- and depth-dependent values |

The source document calls the first five items confirmed. This repository uses
the more conservative `OBSERVED` state until byte-identical reference inputs,
outputs and provenance are checked into or reproducibly generated for tests.

## `PAD_INFO.BIN`

| Status | Observation |
|---|---|
| OBSERVED | Total size 3840 bytes |
| OBSERVED | 120 records of 32 bytes |
| OBSERVED | Each record contains eight 32-bit big-endian values |
| OBSERVED | One field stores the complete converted WAV size |
| UNKNOWN | Exact record-to-pad mapping |
| UNKNOWN | Empty-pad record values |
| UNKNOWN | Meaning and offsets of all eight fields |
| UNKNOWN | Gate, loop, trigger and tempo parameters |

## Evidence required for the writers

1. Original small PCM inputs with known samples and metadata.
2. Their untouched output from the official Roland converter.
3. `PAD_INFO.BIN` for an empty card, one occupied pad and multiple pads.
4. Controlled pairs changing only pad, duration, channel count or file size.
5. Exact converter version, platform, settings and creation procedure.
6. SHA-256 hashes and permission to redistribute fixtures, or a private test
   process if redistribution is impossible.
7. Hardware results from an SP-404SX and, separately, an SP-404A.
