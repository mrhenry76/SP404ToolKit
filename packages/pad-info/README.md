# PAD_INFO Analyzer v0.1

Read-only parser and CLI for:

```text
ROLAND/SP-404SX/SMPL/PAD_INFO.BIN
```

The parser requires exactly 3840 bytes and returns 120 records of 32 bytes in
A1 through J12 order. Every numeric field is read as unsigned 32-bit
big-endian. Unknown fields and unknown flag/format values are preserved.

## CLI

```sh
npm run pad-info:analyze -- /private/path/PAD_INFO.BIN
npm run pad-info:analyze -- /private/path/PAD_INFO.BIN --pad A1
npm run pad-info:analyze -- /private/path/PAD_INFO.BIN --occupied-only
npm run pad-info:analyze -- /private/path/PAD_INFO.BIN --format json
npm run pad-info:analyze -- /private/path/PAD_INFO.BIN --format markdown
```

Invalid sizes, missing files, unknown output formats and invalid pad filters
return a non-zero exit code. The CLI never writes to the input path.

## Private result validation

Roland-generated fixtures are not committed. A private extracted results folder
can be checked locally with:

```sh
SP404_RESULTS_DIR=/private/Results_clean/Results \
  npm test -- packages/pad-info/src/private-results.test.ts
```

Without `SP404_RESULTS_DIR`, those private integration tests are skipped while
all synthetic parser tests continue to run in CI.

No writer or serializer is included.
