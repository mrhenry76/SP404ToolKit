# SP404 Toolkit

SP404 Toolkit is an open-source, local-first web application for importing,
checking, mapping and eventually converting WAV samples for the Roland
SP-404SX and SP-404A.

> Foundation v0.1 is under active development. Roland conversion is not yet
> implemented and no compatibility claim is made at this stage.

## Foundation v0.1

This milestone provides:

- an npm-workspaces TypeScript monorepo;
- a minimal React/Vite application with the complete A1–J12 pad grid;
- a browser-independent model for projects, samples and pads;
- filename-to-pad recognition;
- a versioned JSON manifest parser;
- a defensive RIFF/WAVE parser;
- initial validation helpers and automated tests;
- explicit placeholders for `RLND` and `PAD_INFO.BIN`;
- CI on Linux, macOS and Windows.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Development

```sh
npm install
npm run dev
```

Vite prints the local URL. Files selected in the application stay on the
device; Foundation v0.1 does not upload audio anywhere.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

## Reverse Engineering Lab

The v0.2 laboratory provides deterministic synthetic fixtures and read-only
diagnostic tools:

```sh
npm run lab:build
npm run lab:generate -- --signal impulse --frames 100 --channels mono --output sample.wav
npm run lab:fixtures -- --overwrite
npm run lab:inspect -- fixtures/source/mono-impulse-5000f.wav
npm run lab:compare -- first.bin second.bin --context 8 --interpret
npm run lab:validate-experiment -- experiments/example.json
```

Il generatore non sovrascrive WAV o metadata esistenti: la sostituzione richiede
l'opzione esplicita `--overwrite`.

All inspection and comparison commands support human-readable, JSON and
Markdown reports. See [`docs/reverse-engineering`](docs/reverse-engineering)
before collecting official converter output. No Roland writer is implemented.

## Project structure

- `apps/web`: user interface only
- `packages/core`: shared serializable domain model and pad utilities
- `packages/wav`: RIFF/WAVE parsing
- `packages/manifest`: manifest v1 parsing and serialization
- `packages/validator`: reusable validation rules
- `packages/roland-sp404sx`: documented conversion boundary (no speculative writer)
- `docs`: architecture, roadmap, testing and reverse-engineering notes
- `fixtures`: synthetic and independently distributable test material only

## Status of Roland formats

Confirmed observations and unknowns are tracked in
[`docs/reverse-engineering.md`](docs/reverse-engineering.md). The Toolkit will
not implement the Roland writer until adequate reference fixtures allow
repeatable golden-file tests.

## Trademark notice

This project is not affiliated with, endorsed by, or sponsored by Roland.
Roland, SP-404SX and SP-404A are trademarks of their respective owners and are
used solely to describe compatibility.

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
