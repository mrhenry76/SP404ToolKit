# Architecture

## Boundaries

The repository is an npm-workspaces monorepo. Each package has a narrow role:

| Module | Owns | Must not own |
|---|---|---|
| `core` | Serializable domain types, pad model, mapping utilities | Browser `File`, React, Roland binary logic |
| `wav` | Defensive RIFF/WAVE parsing and PCM access | UI and Roland assumptions |
| `manifest` | Version 1 schema boundary and JSON validation | Audio bytes |
| `validator` | Technical and mapping messages | UI rendering or automatic correction |
| `roland-sp404sx` | Future verified Roland output | Speculative binary fields and UI |
| `reverse-engineering-lab` | Synthetic fixtures, read-only inspection, comparison and experiment records | Roland writers or semantic claims from unverified bytes |
| `pad-info` | Read-only decoding and reporting for the fixed-size `PAD_INFO.BIN` table | Serialization, normalization or Roland writers |
| `web` | Browser adapters and presentation | Binary format implementation |

Dependencies point inward toward the small data model. Browser-specific file
handles are deliberately kept outside serializable project data.

## Data flow

1. A browser adapter receives local files.
2. `wav` reads metadata without altering PCM data.
3. `core` assigns explicit filename pads, then free pads.
4. `validator` produces structured messages.
5. `manifest` reads or writes a portable project description.
6. A future verified Roland adapter will build export artifacts.

## Compatibility policy

Node.js 20 and 22 are tested in CI on Ubuntu, macOS and Windows. Browser
support will be fixed before the public beta; Foundation v0.1 targets current
evergreen browsers supported by Vite 7.
