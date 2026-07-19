import { describe, expect, it } from "vitest";
import {
  assignWorkflowPad,
  createProjectWorkflow,
  importWavSources,
  openProjectManifest,
  relinkSource,
  relinkUniqueSources,
  serializeProjectManifest,
  summarizeWorkflow,
  unassignWorkflowSample,
  type LocalWavSource,
} from "./workflow.js";

function makePcmWav(): Uint8Array {
  const bytes = new Uint8Array(48);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) bytes[offset + index] = value.charCodeAt(index);
  };
  write(0, "RIFF");
  view.setUint32(4, 40, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 44_100, true);
  view.setUint32(28, 88_200, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, 4, true);
  view.setInt16(44, 1, true);
  view.setInt16(46, -1, true);
  return bytes;
}

function source(name: string, bytes = makePcmWav()): LocalWavSource & { bytes: Uint8Array; calls: () => number } {
  let count = 0;
  return {
    name,
    bytes,
    calls: () => count,
    async arrayBuffer() {
      count += 1;
      return bytes.slice().buffer;
    },
  };
}

describe("local project workflow", () => {
  it("imports incrementally, preserves source bytes and explains fallback mapping", async () => {
    const first = source("[A2] Kick.wav");
    const original = first.bytes.slice();
    let workflow = await importWavSources(createProjectWorkflow("SP404A"), [first]);
    workflow = await importWavSources(workflow, [source("Snare.wav")]);

    expect(workflow.project.target).toBe("SP404A");
    expect(workflow.project.samples.map(({ fileName, pad }) => ({ fileName, pad }))).toEqual([
      { fileName: "[A2] Kick.wav", pad: "A2" },
      { fileName: "Snare.wav", pad: "A1" },
    ]);
    expect(workflow.project.samples[1]?.validation).toContainEqual(expect.objectContaining({
      category: "mapping",
      code: "AUTO_PAD_FALLBACK",
      severity: "info",
    }));
    expect(first.calls()).toBe(1);
    expect(first.bytes).toEqual(original);
    expect(workflow.sources.size).toBe(2);
  });

  it("keeps malformed WAV files visible with contextual diagnostics", async () => {
    const workflow = await importWavSources(createProjectWorkflow(), [source("broken.wav", new Uint8Array([1, 2]))]);
    expect(workflow.project.samples).toHaveLength(1);
    expect(workflow.project.samples[0]).toMatchObject({
      fileName: "broken.wav",
      metadata: {},
      validation: expect.arrayContaining([expect.objectContaining({
        category: "wav-structure",
        code: "WAV_TOO_SHORT",
        sampleId: "sample-1",
      })]),
    });
    expect(workflow.sources.has("sample-1")).toBe(true);
  });

  it("keeps duplicate filenames as distinct linked samples", async () => {
    const workflow = await importWavSources(createProjectWorkflow(), [source("same.wav"), source("same.wav")]);
    expect(workflow.project.samples.map(({ id, pad }) => ({ id, pad }))).toEqual([
      { id: "sample-1", pad: "A1" },
      { id: "sample-2", pad: "A2" },
    ]);
    expect(workflow.sources.size).toBe(2);
  });

  it("rejects collisions and performs explicit reassign and unassign operations", async () => {
    const workflow = await importWavSources(createProjectWorkflow(), [source("one.wav"), source("two.wav")]);
    const conflict = assignWorkflowPad(workflow, "sample-2", "A1");
    expect(conflict.workflow).toBe(workflow);
    expect(conflict.diagnostic).toMatchObject({ code: "PAD_OCCUPIED", sampleId: "sample-2", pad: "A1" });
    expect(workflow.project.samples[1]?.pad).toBe("A2");

    const moved = assignWorkflowPad(workflow, "sample-2", "A3");
    expect(moved.diagnostic).toBeNull();
    expect(moved.workflow.project.samples[1]?.pad).toBe("A3");
    const unassigned = unassignWorkflowSample(moved.workflow, "sample-2");
    expect(unassigned.diagnostic).toBeNull();
    expect(unassigned.workflow.project.samples[1]?.pad).toBeNull();
  });

  it("leaves samples beyond 120 pads unassigned", async () => {
    const selected = Array.from({ length: 121 }, (_, index) => source(`sample-${index}.wav`));
    const workflow = await importWavSources(createProjectWorkflow(), selected);
    expect(workflow.project.samples[120]).toMatchObject({
      pad: null,
      validation: [expect.objectContaining({ code: "PAD_EXHAUSTED", severity: "error" })],
    });
    expect(summarizeWorkflow(workflow)).toMatchObject({ total: 121, assigned: 120, unassigned: 1 });
  });

  it("downloads and reopens a portable manifest without browser or derived data", async () => {
    const imported = await importWavSources(createProjectWorkflow("SP404A"), [source("Kick.wav")]);
    const json = serializeProjectManifest(imported);
    expect(json).not.toContain("sampleRate");
    expect(json).not.toContain("sample-1");
    expect(json).not.toContain("bytes");

    const reopened = openProjectManifest(json);
    expect(reopened.project).toMatchObject({
      target: "SP404A",
      samples: [{ fileName: "Kick.wav", displayName: "Kick", pad: "A1", metadata: {} }],
    });
    expect(reopened.sources.size).toBe(0);
    expect(summarizeWorkflow(reopened).missingSources).toBe(1);
  });

  it("relinks only unique filename matches and leaves ambiguous duplicates untouched", async () => {
    const workflow = openProjectManifest({
      version: 1,
      target: "SP404SX",
      samples: [
        { file: "Kick.wav", name: "Kick", pad: "A1" },
        { file: "Duplicate.wav", name: "Duplicate one", pad: "A2" },
        { file: "Duplicate.wav", name: "Duplicate two", pad: "A3" },
      ],
    });
    const bulk = await relinkUniqueSources(workflow, [source("Kick.wav"), source("Duplicate.wav")]);
    expect(bulk.results).toEqual([
      { fileName: "Kick.wav", status: "linked", sampleIds: ["manifest-sample-1"] },
      { fileName: "Duplicate.wav", status: "ambiguous", sampleIds: ["manifest-sample-2", "manifest-sample-3"] },
    ]);
    expect(bulk.workflow.sources.size).toBe(1);

    const explicit = await relinkSource(bulk.workflow, "manifest-sample-2", source("Duplicate.wav"));
    expect(explicit.result.status).toBe("linked");
    expect(explicit.workflow.sources.has("manifest-sample-2")).toBe(true);
    expect(explicit.workflow.sources.has("manifest-sample-3")).toBe(false);
  });
});
