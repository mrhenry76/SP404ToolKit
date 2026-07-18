# File formats

## WAV input

`packages/wav` currently accepts a RIFF container whose form is `WAVE` and
requires both `fmt ` and `data` chunks. It:

- reads little-endian RIFF and format fields;
- does not assume chunk order;
- skips unknown chunks;
- honors padding after odd-sized chunks;
- validates chunk and extension boundaries;
- reports PCM when format tag `1` is present;
- exposes PCM bytes without changing them.

Parsing a structurally valid non-PCM WAVE is allowed; validation determines
whether it can be exported. RF64, Wave64 and RIFX are not supported.

## Manifest v1

```json
{
  "version": 1,
  "target": "SP404SX",
  "samples": [
    { "pad": "A1", "file": "Kick.wav", "name": "Kick" }
  ]
}
```

Pads may be `null` before assignment. Valid IDs run from A1 through J12. A
manifest contains at most 120 samples and may not assign one pad twice.

## Roland output

Not implemented. Known observations and open fields are recorded in
`reverse-engineering.md`.
