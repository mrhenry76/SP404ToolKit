import { describe, expect, it } from "vitest";
import type { SampleAsset, ToolkitProject } from "./model.js";
import { assignSampleToPad, reassignSample, releasePad, unassignSample } from "./project.js";

function sample(id: string, pad: SampleAsset["pad"]): SampleAsset {
  return { id, fileName: `${id}.wav`, displayName: id, pad, metadata: {}, validation: [] };
}

const project = (): ToolkitProject => ({
  schemaVersion: 1,
  target: "SP404A",
  samples: [sample("kick", "A1"), sample("snare", "A2"), sample("hat", null)],
});

describe("project pad assignments", () => {
  it("supports both SX and A project targets", () => {
    expect(({ ...project(), target: "SP404SX" } satisfies ToolkitProject).target).toBe("SP404SX");
    expect(project().target).toBe("SP404A");
  });

  it("assigns and reassigns immutably", () => {
    const original = project();
    const assigned = assignSampleToPad(original, "hat", "A3");
    expect(assigned).toMatchObject({ ok: true, code: "PAD_ASSIGNED", previousPad: null, pad: "A3" });
    expect(original.samples[2]?.pad).toBeNull();
    expect(assigned.project).not.toBe(original);
    expect(assigned.project.samples[2]?.pad).toBe("A3");

    const reassigned = reassignSample(assigned.project, "hat", "A4");
    expect(reassigned).toMatchObject({ ok: true, code: "PAD_REASSIGNED", previousPad: "A3", pad: "A4" });
    expect(reassigned.project.samples[2]?.pad).toBe("A4");
  });

  it("rejects occupied pads without hidden mutation", () => {
    const original = project();
    const result = reassignSample(original, "hat", "A1");
    expect(result).toMatchObject({
      ok: false,
      code: "PAD_OCCUPIED",
      sampleId: "hat",
      pad: "A1",
      occupiedBySampleId: "kick",
    });
    expect(result.project).toBe(original);
    expect(original.samples.map(({ pad }) => pad)).toEqual(["A1", "A2", null]);
  });

  it("unassigns samples and releases pads explicitly", () => {
    const original = project();
    const unassigned = unassignSample(original, "kick");
    expect(unassigned).toMatchObject({ ok: true, code: "PAD_UNASSIGNED", previousPad: "A1", pad: null });
    expect(unassigned.project.samples[0]?.pad).toBeNull();

    const released = releasePad(original, "A2");
    expect(released).toMatchObject({ ok: true, code: "PAD_RELEASED", sampleId: "snare", pad: "A2" });
    expect(released.project.samples[1]?.pad).toBeNull();
  });

  it("reports a missing sample without mutation", () => {
    const original = project();
    expect(assignSampleToPad(original, "missing", "A3")).toEqual({
      ok: false,
      code: "SAMPLE_NOT_FOUND",
      project: original,
      sampleId: "missing",
      pad: "A3",
    });
  });
});
