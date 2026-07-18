# Reverse Engineering Lab v0.2

## Objective

Build a repeatable evidence laboratory for the Roland SP-404SX/SP-404A file
formats. This milestone collects controlled fixtures, compares official
converter output and records findings with enough provenance to support later
writer implementation.

No `RLND` or `PAD_INFO.BIN` writer is part of this milestone.

## Entry conditions

- Foundation v0.1 is tagged and green on Linux, macOS and Windows.
- Synthetic source fixtures can be redistributed under the project license.
- Official Roland converter output has documented provenance and permission to
  be stored publicly, or a documented private verification path exists.
- At least one SP-404SX is available for hardware validation. SP-404A results
  must be recorded separately when that hardware becomes available.

## Evidence states

Every recorded claim uses exactly one state:

- `CONFIRMED`: reproduced by controlled fixtures and automated tests;
- `OBSERVED`: present in available evidence but not sufficiently isolated;
- `HYPOTHESIS`: a proposed interpretation with a stated falsification test;
- `UNKNOWN`: not established.

Changing a claim to `CONFIRMED` requires links to inputs, outputs, hashes,
comparison results and the test that protects the finding.

## Workstreams

### 1. Synthetic fixture generator

Generate very small PCM WAV files with known sample sequences and metadata:

- silence;
- single impulse;
- constant signed values;
- ascending sample values;
- short sine wave;
- mono and stereo channel-identification signals.

The generator must record its parameters and SHA-256 hashes. Generated output
must be deterministic across supported platforms.

### 2. WAV structure inspector

Create a read-only diagnostic tool based on `packages/wav` that reports:

- RIFF size and physical file size;
- chunk order, offsets, lengths and padding;
- decoded `fmt ` fields;
- `data` offset and hash of untouched PCM bytes;
- unknown chunks as raw offset ranges, without assigning meaning.

### 3. Binary comparison tool

Compare controlled file pairs byte by byte and report:

- changed byte ranges;
- unchanged ranges;
- little-endian and big-endian integer interpretations as diagnostics only;
- correlation with the single variable changed in the experiment.

Interpretations remain `HYPOTHESIS` until independently verified.

### 4. `RLND` experiment matrix

Begin with a documented baseline, then change one variable per conversion:

| Variable | Minimum controlled cases |
|---|---|
| Duration/frame count | short baseline plus two distinct lengths |
| Channels | mono and stereo |
| PCM content | silence, impulse and known sequence |
| Filename | same audio with two names |
| Pad assignment | only if the official workflow changes the WAV by pad |
| Sample rate/bit depth | only formats accepted by the official converter |

The reported 458-byte `RLND` size, 18-byte `fmt ` size and PCM offset 512 stay
`OBSERVED` until the controlled fixtures reproduce them.

### 5. `PAD_INFO.BIN` experiment matrix

Collect at minimum:

- empty card/project;
- one sample on A1;
- the same sample on A2, C10 and J12;
- two occupied pads;
- same pad with two distinct WAV sizes;
- mono and stereo cases;
- gate, loop, trigger and tempo variations only when explicitly controlled.

Each case must preserve the matching converted WAV files and exact settings.

### 6. Hardware verification log

For every candidate format finding, record:

- hardware model and firmware;
- SD-card preparation method;
- recognition after cold boot;
- occupied pad and playback result;
- duration/channel correctness;
- errors or card mutations after use.

Passing on SP-404SX does not automatically confirm SP-404A compatibility.

## Fixture provenance record

Every experiment must include:

- unique experiment ID;
- creation date and operator;
- source generator version and parameters;
- official converter version, operating system and settings;
- input/output SHA-256 hashes;
- the single changed variable;
- expected observation and actual result;
- redistribution status;
- related issue, notes and automated test.

## Deliverables

- deterministic synthetic fixture generator;
- WAV structure inspector;
- binary comparison report format;
- initial controlled source/official-output fixture set;
- `RLND` and `PAD_INFO.BIN` offset maps with explicit evidence states;
- hardware verification checklist and completed SP-404SX baseline;
- tests for every promoted `CONFIRMED` finding;
- documented evidence still required before writer work.

## Exit criteria

Reverse Engineering Lab v0.2 is complete when:

1. experiments are reproducible from documented inputs;
2. all public fixtures have clear redistribution rights;
3. the baseline and single-variable matrices have been executed;
4. confirmed invariants are protected by automated tests;
5. unknown fields remain explicitly unknown;
6. hardware results are recorded separately from structural file checks;
7. there is enough evidence to propose, but not silently begin, the first
   narrowly scoped writer milestone.

## Explicit non-goals

- writing or patching `RLND`;
- generating `PAD_INFO.BIN`;
- claiming SP-404A compatibility from SP-404SX observations;
- automatic audio conversion, normalization or mastering;
- interpreting fields from a single example;
- including copyrighted or provenance-unclear audio.
