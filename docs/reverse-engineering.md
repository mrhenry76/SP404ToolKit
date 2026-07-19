# Reverse-engineering register

Status vocabulary:

- **CONFIRMED**: supported by controlled evidence and protected by repeatable tests
- **OBSERVED**: present in available evidence but not sufficiently isolated
- **HYPOTHESIS**: a proposed explanation awaiting a controlled test
- **UNKNOWN**: not established

No Roland binary writer may turn an `OBSERVED`, `HYPOTHESIS` or `UNKNOWN`
value into fixed behavior without evidence and review.

## Converted WAV

| Status | Confirmed invariant |
|---|---|
| CONFIRMED | The `fmt ` chunk payload is 18 bytes |
| CONFIRMED | The `RLND` chunk payload is 458 bytes |
| CONFIRMED | PCM begins at absolute offset 512 |

The meaning of fields inside the `RLND` payload remains unknown. No further
semantic interpretation is implied by its size or position.

## `PAD_INFO.BIN`

| Status | Confirmed invariant |
|---|---|
| CONFIRMED | Total file size is 3840 bytes |
| CONFIRMED | The file contains 120 records of 32 bytes |
| CONFIRMED | Each record contains eight unsigned 32-bit big-endian values |
| CONFIRMED | Records map in order from A1 through J12 |
| CONFIRMED | `0x7F000001` identifies an occupied record |
| CONFIRMED | `0x7F000000` identifies an empty record |
| CONFIRMED | `0x00010100` identifies mono |
| CONFIRMED | `0x00010200` identifies stereo |
| CONFIRMED | An empty record reports size 512 |
| CONFIRMED | An occupied record reports `512 + PCM byte length` |

The flag values `0x7F000100` and `0x7F010100` remain uninterpreted. The values
at record offsets 24 and 28 are retained raw and remain uninterpreted. Gate,
loop, trigger, tempo and any other unconfirmed semantics remain unknown.

## `STPINFO.BIN`

`STPINFO.BIN` remains uninterpreted. The project has no parser, semantic model
or writer for it.

## Writer boundary

No `RLND`, `PAD_INFO.BIN` or `STPINFO.BIN` writer is implemented. A future
writer requires controlled inputs and outputs, hashes, documented provenance,
golden-file tests and separate SP-404SX/SP-404A hardware verification.
