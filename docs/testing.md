# Testing

Run the complete local verification with:

```sh
npm test
npm run typecheck
npm run build
```

Vitest currently covers pad boundaries, documented filename patterns,
automatic assignment, manifest validation, RIFF chunk traversal, odd padding,
extended `fmt ` chunks, PCM access and malformed/truncated input.

CI runs the same commands on Ubuntu, macOS and Windows with Node.js 20 and 22.

## Fixture policy

- Prefer generated silence, impulses, sine waves and known PCM sequences.
- Include generator source or exact reproduction instructions.
- Record SHA-256 hashes for binary golden files.
- Do not include commercial samples or files with unclear redistribution rights.
- Roland output fixtures need converter version, settings and platform metadata.

Hardware verification is required before declaring Roland conversion complete.
