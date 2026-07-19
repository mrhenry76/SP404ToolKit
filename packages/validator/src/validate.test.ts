import { describe, expect, it } from "vitest";
import type { ParsedWav } from "@sp404-toolkit/wav";
import {
  hardwareCompatibilityNotice,
  validateAutomaticPadAssignment,
  validatePadAssignments,
  validateSourceAvailability,
  validateWav,
  validationMessageForWavError,
} from "./validate.js";
import { WavParseError } from "@sp404-toolkit/wav";

const wav = {
  isPcm: true,
  data: { size: 4 },
  format: { channels: 1, blockAlign: 2 },
} as ParsedWav;

describe("validation", () => {
  it("accepts a basic PCM WAV without mutation", () => {
    const original = structuredClone(wav);
    expect(validateWav(wav, { sampleId: "kick", pad: "A1" })).toEqual([]);
    expect(wav).toEqual(original);
  });
  it("reports non-PCM and empty audio", () => {
    const messages = validateWav(
      { ...wav, isPcm: false, data: { ...wav.data, size: 0 } },
      { sampleId: "sample-1", pad: "A1" },
    );
    expect(messages.map(({ code }) => code)).toEqual(["WAV_NOT_PCM", "WAV_EMPTY"]);
    expect(messages[0]).toMatchObject({
      severity: "error",
      category: "technical",
      sampleId: "sample-1",
      pad: "A1",
      suggestedAction: "Choose a linear PCM WAV source.",
    });
  });
  it("reports PCM frame misalignment structurally", () => {
    expect(validateWav({ ...wav, data: { ...wav.data, size: 3 } }, { sampleId: "sample-1" })[0]).toMatchObject({
      severity: "error",
      category: "wav-structure",
      code: "WAV_FRAME_ALIGNMENT",
      sampleId: "sample-1",
    });
  });
  it("reports duplicate and unassigned pads", () => {
    const input = [{ id: "one", pad: "A1" }, { id: "two", pad: "A1" }, { id: "three", pad: null }] as const;
    const messages = validatePadAssignments(input);
    expect(messages.map(({ code }) => code)).toEqual([
      "PAD_DUPLICATE",
      "PAD_UNASSIGNED",
    ]);
    expect(messages[0]).toMatchObject({ category: "mapping", sampleId: "two", pad: "A1" });
    expect(input).toEqual([{ id: "one", pad: "A1" }, { id: "two", pad: "A1" }, { id: "three", pad: null }]);
  });
  it("keeps automatic fallback, source and compatibility diagnostics distinct", () => {
    expect(validateAutomaticPadAssignment({
      status: "fallback",
      code: "AUTO_PAD_FALLBACK",
      fileName: "kick.wav",
      requestedPad: null,
      pad: "A1",
      reason: "NO_FILENAME_MATCH",
    }, "kick")[0]).toMatchObject({ category: "mapping", severity: "info", code: "AUTO_PAD_FALLBACK" });
    expect(validateSourceAvailability([{ id: "kick", pad: "A1", available: false }])[0]).toMatchObject({
      category: "source",
      sampleId: "kick",
      pad: "A1",
      code: "SOURCE_MISSING",
    });
    expect(hardwareCompatibilityNotice("SP404A")).toMatchObject({
      category: "compatibility",
      code: "HARDWARE_COMPATIBILITY_UNVERIFIED",
    });
  });
  it("converts parser failures into contextual structural diagnostics", () => {
    expect(validationMessageForWavError(
      new WavParseError("TRUNCATED_RIFF", "Truncated."),
      { sampleId: "broken", pad: "B2" },
    )).toMatchObject({
      severity: "error",
      category: "wav-structure",
      code: "TRUNCATED_RIFF",
      sampleId: "broken",
      pad: "B2",
      suggestedAction: "Choose a structurally valid RIFF/WAVE file.",
    });
  });
});
