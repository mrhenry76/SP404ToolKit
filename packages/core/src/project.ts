import type { ToolkitProject } from "./model.js";
import type { PadId } from "./pads.js";

export type ProjectAssignmentSuccessCode =
  | "PAD_ASSIGNED"
  | "PAD_REASSIGNED"
  | "PAD_UNASSIGNED"
  | "PAD_ALREADY_UNASSIGNED"
  | "PAD_RELEASED"
  | "PAD_ALREADY_FREE";

export type ProjectAssignmentResult =
  | {
      ok: true;
      code: ProjectAssignmentSuccessCode;
      project: ToolkitProject;
      sampleId: string | null;
      pad: PadId | null;
      previousPad: PadId | null;
    }
  | {
      ok: false;
      code: "PAD_OCCUPIED" | "SAMPLE_NOT_FOUND";
      project: ToolkitProject;
      sampleId: string;
      pad: PadId | null;
      occupiedBySampleId?: string;
    };

function setSamplePad(project: ToolkitProject, sampleId: string, pad: PadId | null): ProjectAssignmentResult {
  const sample = project.samples.find((candidate) => candidate.id === sampleId);
  if (!sample) return { ok: false, code: "SAMPLE_NOT_FOUND", project, sampleId, pad };

  if (pad) {
    const occupant = project.samples.find((candidate) => candidate.id !== sampleId && candidate.pad === pad);
    if (occupant) {
      return {
        ok: false,
        code: "PAD_OCCUPIED",
        project,
        sampleId,
        pad,
        occupiedBySampleId: occupant.id,
      };
    }
  }

  const previousPad = sample.pad;
  if (previousPad === pad) {
    return {
      ok: true,
      code: pad ? "PAD_ASSIGNED" : "PAD_ALREADY_UNASSIGNED",
      project,
      sampleId,
      pad,
      previousPad,
    };
  }

  const samples = project.samples.map((candidate) =>
    candidate.id === sampleId ? { ...candidate, pad } : candidate,
  );
  return {
    ok: true,
    code: pad ? (previousPad ? "PAD_REASSIGNED" : "PAD_ASSIGNED") : "PAD_UNASSIGNED",
    project: { ...project, samples },
    sampleId,
    pad,
    previousPad,
  };
}

export function assignSampleToPad(
  project: ToolkitProject,
  sampleId: string,
  pad: PadId,
): ProjectAssignmentResult {
  return setSamplePad(project, sampleId, pad);
}

export function reassignSample(
  project: ToolkitProject,
  sampleId: string,
  pad: PadId,
): ProjectAssignmentResult {
  return setSamplePad(project, sampleId, pad);
}

export function unassignSample(project: ToolkitProject, sampleId: string): ProjectAssignmentResult {
  return setSamplePad(project, sampleId, null);
}

export function releasePad(project: ToolkitProject, pad: PadId): ProjectAssignmentResult {
  const occupant = project.samples.find((sample) => sample.pad === pad);
  if (!occupant) {
    return {
      ok: true,
      code: "PAD_ALREADY_FREE",
      project,
      sampleId: null,
      pad,
      previousPad: null,
    };
  }
  const result = setSamplePad(project, occupant.id, null);
  return result.ok ? { ...result, code: "PAD_RELEASED", pad } : result;
}
