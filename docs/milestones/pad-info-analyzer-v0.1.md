# PAD_INFO Analyzer v0.1

## Scope

This milestone adds a read-only parser and analyzer for the observed
`PAD_INFO.BIN` table. It does not generate, repair, normalize or overwrite
Roland files.

## Confirmed layout used by the parser

- file size: 3840 bytes;
- record count: 120;
- record size: 32 bytes;
- record 0: A1;
- record 119: J12;
- all eight fields are unsigned 32-bit big-endian values.

| Record offset | Field |
|---:|---|
| 0 | PCM offset |
| 4 | WAV size |
| 8 | duplicate PCM offset |
| 12 | duplicate WAV size |
| 16 | flags |
| 20 | format |
| 24 | unknown, retained raw |
| 28 | unknown, retained raw |

Confirmed values:

- `0x7F000001`: occupied;
- `0x7F000000`: empty;
- `0x00010100`: mono;
- `0x00010200`: stereo;
- empty size: 512;
- occupied size: 512 plus PCM byte length.

Unexpected flags, formats, sizes or duplicate fields are reported as issues;
they are not assigned speculative meaning.

## Controlled private validation

`Results_clean.zip` was read locally without committing its contents. The
private integration suite checks:

- mono 5000 frames: size 10512, mono;
- stereo 5000 frames: size 20512, stereo;
- mono 10000 frames: size 20512, mono;
- stereo 10000 frames: size 40512, stereo;
- empty A1: size 512;
- A1/A2 record ordering and occupancy.

Some captured files retain pads created by earlier steps. The analyzer reports
the complete file state rather than inferring the intended experiment setup.

The private files also contain flag values `0x7F000100` and `0x7F010100` in
records outside the controlled A-bank cases. Their meaning is not established;
v0.1 preserves them and reports those records as `unknown`.

## Redistribution boundary

No `PAD_INFO.BIN`, `STPINFO.BIN`, Roland WAV, software archive or SD-card image
is stored in the public repository. Tests committed to the project construct
only synthetic byte arrays from confirmed invariants. Production code exposes
no writer.
