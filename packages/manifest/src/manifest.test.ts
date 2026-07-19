import { describe, expect, it } from "vitest";
import type { ToolkitProject } from "@sp404-toolkit/core";
import {
  ManifestError,
  manifestToProject,
  parseManifest,
  projectToManifest,
  serializeManifest,
  type ManifestV1,
} from "./manifest.js";

const valid = {
  version: 1,
  target: "SP404SX",
  samples: [{ pad: "A1", file: "Kick.wav", name: "Kick" }],
} satisfies ManifestV1;

describe("manifest v1", () => {
  it.each(["SP404SX", "SP404A"] as const)("round-trips target %s", (target) => {
    const manifest = { ...valid, target, samples: [
      { pad: "A1" as const, file: "Kick.wav", name: "Kick" },
      { pad: null, file: "Loose.wav", name: "Loose" },
    ] };
    expect(parseManifest(JSON.stringify(manifest))).toEqual(manifest);
    expect(JSON.parse(serializeManifest(manifest))).toEqual(manifest);
    expect(manifestToProject(manifest)).toMatchObject({
      schemaVersion: 1,
      target,
      samples: [
        { id: "manifest-sample-1", fileName: "Kick.wav", displayName: "Kick", pad: "A1" },
        { id: "manifest-sample-2", fileName: "Loose.wav", displayName: "Loose", pad: null },
      ],
    });
  });

  it("normalizes lowercase pads", () => {
    expect(parseManifest({ ...valid, samples: [{ ...valid.samples[0], pad: "j12" }] }).samples[0]?.pad).toBe("J12");
  });

  it("rejects unsupported versions, invalid pads and duplicates", () => {
    expect(() => parseManifest({ ...valid, version: 2 })).toThrowError(ManifestError);
    expect(() => parseManifest({ ...valid, samples: [{ ...valid.samples[0], pad: "K1" }] })).toThrowError(/invalid pad/);
    expect(() => parseManifest({ ...valid, samples: [valid.samples[0], valid.samples[0]] })).toThrowError(/more than once/);
    expect(() => parseManifest({ ...valid, target: "OTHER" })).toThrowError(/SP404SX or SP404A/);
  });

  it("rejects malformed JSON and more than 120 samples", () => {
    expect(() => parseManifest("{")).toThrowError(ManifestError);
    expect(() => parseManifest({
      ...valid,
      samples: Array.from({ length: 121 }, (_, index) => ({ pad: null, file: `${index}.wav`, name: `${index}` })),
    })).toThrowError(/more than 120/);
  });

  it("converts projects without serializing browser data or derived metadata", () => {
    const project: ToolkitProject = {
      schemaVersion: 1,
      target: "SP404A",
      samples: [{
        id: "browser-id",
        fileName: "Kick.wav",
        displayName: "Kick",
        pad: "A1",
        metadata: { sampleRate: 44_100, bitDepth: 16 },
        validation: [{
          severity: "info",
          category: "compatibility",
          code: "TEST",
          message: "Derived",
        }],
      }],
    };
    const manifest = projectToManifest(project);
    expect(manifest).toEqual({
      version: 1,
      target: "SP404A",
      samples: [{ pad: "A1", file: "Kick.wav", name: "Kick" }],
    });
    const json = serializeManifest(manifest);
    expect(json).not.toContain("browser-id");
    expect(json).not.toContain("metadata");
    expect(json).not.toContain("sampleRate");
    expect(parseManifest(json)).toEqual(manifest);
  });
});
