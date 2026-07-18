import { describe, expect, it } from "vitest";
import type { ParsedWav } from "@sp404-toolkit/wav";
import { validatePadAssignments, validateWav } from "./validate.js";

const wav = {
  isPcm: true,
  data: { size: 4 },
  format: { channels: 1 },
} as ParsedWav;

describe("validation", () => {
  it("accepts a basic PCM WAV", () => expect(validateWav(wav)).toEqual([]));
  it("reports non-PCM and empty audio", () => {
    expect(validateWav({ ...wav, isPcm: false, data: { ...wav.data, size: 0 } }).map(({ code }) => code)).toEqual([
      "WAV_NOT_PCM",
      "WAV_EMPTY",
    ]);
  });
  it("reports duplicate and unassigned pads", () => {
    expect(validatePadAssignments([{ pad: "A1" }, { pad: "A1" }, { pad: null }]).map(({ code }) => code)).toEqual([
      "PAD_DUPLICATE",
      "PAD_UNASSIGNED",
    ]);
  });
});
