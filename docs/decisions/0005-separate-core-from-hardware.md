# ADR 0005: Separate core, audio logic and hardware formats

- Status: Accepted
- Date: 2026-07-19

## Decision

Keep the serializable project core independent from generic audio logic and
hardware-specific adapters. The core owns project data, pad assignments and
portable metadata. Generic audio parsing or future processing belongs in
dedicated packages. Roland filesystem and binary details belong only in the
`roland-sp404sx` boundary and evidence tools.

No Roland writer or transformative Audio Engine is currently implemented. Any
future audio transformation requires explicit user consent, and any hardware
writer requires confirmed evidence, repeatable tests and hardware validation.
