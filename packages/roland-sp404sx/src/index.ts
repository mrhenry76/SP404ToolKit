/**
 * Conversion is intentionally unavailable in Foundation v0.1.
 * Do not add RLND or PAD_INFO.BIN writers without documented fixtures and
 * repeatable golden-file tests. See docs/reverse-engineering.md.
 */
export const ROLAND_WRITER_STATUS = "UNKNOWN_FIELDS_BLOCK_IMPLEMENTATION" as const;

export function conversionNotImplemented(): never {
  throw new Error("Roland conversion requires verified reference fixtures and is not implemented in Foundation v0.1.");
}
