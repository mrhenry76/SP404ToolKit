import { describe, expect, it } from "vitest";
import { ManifestError, parseManifest, serializeManifest, type ManifestV1 } from "./manifest.js";

const valid = {
  version: 1,
  target: "SP404SX",
  samples: [{ pad: "A1", file: "Kick.wav", name: "Kick" }],
} satisfies ManifestV1;

describe("manifest v1", () => {
  it("parses and serializes a valid manifest", () => {
    expect(parseManifest(JSON.stringify(valid))).toEqual(valid);
    expect(JSON.parse(serializeManifest(valid))).toEqual(valid);
  });

  it("normalizes lowercase pads", () => {
    expect(parseManifest({ ...valid, samples: [{ ...valid.samples[0], pad: "j12" }] }).samples[0]?.pad).toBe("J12");
  });

  it("rejects unsupported versions, invalid pads and duplicates", () => {
    expect(() => parseManifest({ ...valid, version: 2 })).toThrowError(ManifestError);
    expect(() => parseManifest({ ...valid, samples: [{ ...valid.samples[0], pad: "K1" }] })).toThrowError(/invalid pad/);
    expect(() => parseManifest({ ...valid, samples: [valid.samples[0], valid.samples[0]] })).toThrowError(/more than once/);
  });
});
