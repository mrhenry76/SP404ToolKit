# Testing

Run the complete local verification with:

```sh
npm test
npm run typecheck
npm run build
```

CI runs the same commands on Ubuntu, macOS and Windows with Node.js 20 and 22.

## Test coverage

Foundation tests cover pad boundaries, documented filename mapping, automatic
assignment, manifest validation, RIFF chunk traversal, odd padding, extended
`fmt ` chunks, PCM access, validation messages and malformed input.

Reverse Engineering Lab tests cover deterministic PCM fixture generation,
cross-platform hashes, exact frame counts, overwrite protection, WAV structure
inspection, byte-range comparison and diagnostic report formats. The published
experiment catalog JSON Schema is tested against the runtime validator and the
versioned observation record.

PAD_INFO Analyzer tests cover exact file and record sizes, eight-field
big-endian decoding, A1–J12 ordering, occupied and empty records, mono/stereo
values, unknown-value preservation, duplicate-field diagnostics, filtering and
human, JSON and Markdown reports.

Three optional private PAD_INFO integration tests validate hashes and observed
records from locally held Roland output. They run only when
`SP404_RESULTS_DIR` points to the extracted private results directory:

```sh
SP404_RESULTS_DIR=/private/Results_clean/Results \
  npm test -- packages/pad-info/src/private-results.test.ts
```

Without that environment variable, the three private tests are skipped while
all public synthetic tests continue to run.

## Fixture policy

- Prefer generated silence, impulses, sine waves and known PCM sequences.
- Include generator source or exact reproduction instructions.
- Record SHA-256 hashes for binary golden files.
- Do not include commercial samples or files with unclear redistribution rights.
- Roland output fixtures need converter version, settings and platform metadata.

Hardware verification is required before declaring Roland conversion complete.
