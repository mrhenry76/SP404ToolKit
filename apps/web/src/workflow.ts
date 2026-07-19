import {
  planAutomaticPadAssignments,
  reassignSample,
  unassignSample,
  type PadId,
  type ProjectTarget,
  type SampleAsset,
  type ToolkitProject,
  type ValidationMessage,
} from "@sp404-toolkit/core";
import {
  manifestToProject,
  projectToManifest,
  serializeManifest,
} from "@sp404-toolkit/manifest";
import {
  hardwareCompatibilityNotice,
  validateAutomaticPadAssignment,
  validatePadAssignments,
  validateSourceAvailability,
  validateWav,
  validationMessageForProjectAssignment,
  validationMessageForWavError,
} from "@sp404-toolkit/validator";
import { parseWav } from "@sp404-toolkit/wav";

export type LocalWavSource = {
  readonly name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type ProjectWorkflow = {
  project: ToolkitProject;
  sources: ReadonlyMap<string, LocalWavSource>;
  nextSampleNumber: number;
};

export type RelinkResult = {
  fileName: string;
  status: "linked" | "ambiguous" | "unmatched";
  sampleIds: string[];
};

export type ProjectSummary = {
  total: number;
  assigned: number;
  unassigned: number;
  errors: number;
  warnings: number;
  missingSources: number;
};

export function createProjectWorkflow(target: ProjectTarget = "SP404SX"): ProjectWorkflow {
  return {
    project: { schemaVersion: 1, target, samples: [] },
    sources: new Map(),
    nextSampleNumber: 1,
  };
}

export function setProjectTarget(workflow: ProjectWorkflow, target: ProjectTarget): ProjectWorkflow {
  return { ...workflow, project: { ...workflow.project, target } };
}

function displayName(fileName: string): string {
  return fileName.replace(/\.wav$/iu, "") || fileName;
}

function updateSample(
  project: ToolkitProject,
  sampleId: string,
  update: (sample: SampleAsset) => SampleAsset,
): ToolkitProject {
  return {
    ...project,
    samples: project.samples.map((sample) => sample.id === sampleId ? update(sample) : sample),
  };
}

function moveValidationToPad(messages: readonly ValidationMessage[], pad: PadId | null): ValidationMessage[] {
  return messages.map((message) => {
    const { pad: _previousPad, ...withoutPad } = message;
    return pad ? { ...withoutPad, pad } : withoutPad;
  });
}

async function analyzeSource(
  source: LocalWavSource,
  sample: SampleAsset,
  mappingMessages: ValidationMessage[] = [],
): Promise<SampleAsset> {
  try {
    const bytes = new Uint8Array(await source.arrayBuffer());
    const wav = parseWav(bytes);
    return {
      ...sample,
      metadata: {
        sampleRate: wav.format.sampleRate,
        bitDepth: wav.format.bitDepth,
        channels: wav.format.channels,
        durationSeconds: wav.durationSeconds,
        audioFormat: wav.format.audioFormat,
      },
      validation: [...validateWav(wav, { sampleId: sample.id, pad: sample.pad }), ...mappingMessages],
    };
  } catch (error) {
    return {
      ...sample,
      metadata: {},
      validation: [validationMessageForWavError(error, { sampleId: sample.id, pad: sample.pad }), ...mappingMessages],
    };
  }
}

/** Imports sequentially so only one selected WAV is held as an ArrayBuffer at a time. */
export async function importWavSources(
  workflow: ProjectWorkflow,
  selectedSources: readonly LocalWavSource[],
): Promise<ProjectWorkflow> {
  const occupied = workflow.project.samples.flatMap(({ pad }) => pad ? [pad] : []);
  const assignments = planAutomaticPadAssignments(selectedSources.map(({ name }) => name), occupied);
  const sources = new Map(workflow.sources);
  const imported: SampleAsset[] = [];

  for (let index = 0; index < selectedSources.length; index += 1) {
    const source = selectedSources[index];
    const assignment = assignments[index];
    if (!source || !assignment) continue;
    const id = `sample-${workflow.nextSampleNumber + index}`;
    const sample: SampleAsset = {
      id,
      fileName: source.name,
      displayName: displayName(source.name),
      pad: assignment.pad,
      metadata: {},
      validation: [],
    };
    sources.set(id, source);
    imported.push(await analyzeSource(source, sample, validateAutomaticPadAssignment(assignment, id)));
  }

  return {
    project: { ...workflow.project, samples: [...workflow.project.samples, ...imported] },
    sources,
    nextSampleNumber: workflow.nextSampleNumber + selectedSources.length,
  };
}

export function assignWorkflowPad(
  workflow: ProjectWorkflow,
  sampleId: string,
  pad: PadId,
): { workflow: ProjectWorkflow; diagnostic: ValidationMessage | null } {
  const result = reassignSample(workflow.project, sampleId, pad);
  const diagnostic = validationMessageForProjectAssignment(result);
  if (!result.ok) return { workflow, diagnostic };
  const project = updateSample(result.project, sampleId, (sample) => ({
    ...sample,
    validation: moveValidationToPad(
      sample.validation.filter(({ category }) => category !== "mapping"),
      pad,
    ),
  }));
  return { workflow: { ...workflow, project }, diagnostic: null };
}

export function unassignWorkflowSample(
  workflow: ProjectWorkflow,
  sampleId: string,
): { workflow: ProjectWorkflow; diagnostic: ValidationMessage | null } {
  const result = unassignSample(workflow.project, sampleId);
  const diagnostic = validationMessageForProjectAssignment(result);
  if (!result.ok) return { workflow, diagnostic };
  const project = updateSample(result.project, sampleId, (sample) => ({
    ...sample,
    validation: moveValidationToPad(
      sample.validation.filter(({ category }) => category !== "mapping"),
      null,
    ),
  }));
  return { workflow: { ...workflow, project }, diagnostic: null };
}

export function openProjectManifest(input: string | unknown): ProjectWorkflow {
  const project = manifestToProject(input);
  return {
    project,
    sources: new Map(),
    nextSampleNumber: project.samples.length + 1,
  };
}

export function serializeProjectManifest(workflow: ProjectWorkflow): string {
  return serializeManifest(projectToManifest(workflow.project));
}

export async function relinkSource(
  workflow: ProjectWorkflow,
  sampleId: string,
  source: LocalWavSource,
): Promise<{ workflow: ProjectWorkflow; result: RelinkResult }> {
  const sample = workflow.project.samples.find(({ id }) => id === sampleId);
  if (!sample || sample.fileName !== source.name) {
    return {
      workflow,
      result: { fileName: source.name, status: "unmatched", sampleIds: sample ? [sample.id] : [] },
    };
  }
  const analyzed = await analyzeSource(
    source,
    sample,
    sample.validation.filter(({ category }) => category === "mapping"),
  );
  const sources = new Map(workflow.sources).set(sampleId, source);
  return {
    workflow: { ...workflow, project: updateSample(workflow.project, sampleId, () => analyzed), sources },
    result: { fileName: source.name, status: "linked", sampleIds: [sampleId] },
  };
}

export async function relinkUniqueSources(
  workflow: ProjectWorkflow,
  selectedSources: readonly LocalWavSource[],
): Promise<{ workflow: ProjectWorkflow; results: RelinkResult[] }> {
  const missingByName = new Map<string, SampleAsset[]>();
  for (const sample of workflow.project.samples) {
    if (workflow.sources.has(sample.id)) continue;
    missingByName.set(sample.fileName, [...(missingByName.get(sample.fileName) ?? []), sample]);
  }
  const selectedByName = new Map<string, LocalWavSource[]>();
  for (const source of selectedSources) {
    selectedByName.set(source.name, [...(selectedByName.get(source.name) ?? []), source]);
  }

  let current = workflow;
  const results: RelinkResult[] = [];
  for (const [fileName, sources] of selectedByName) {
    const samples = missingByName.get(fileName) ?? [];
    if (sources.length !== 1 || samples.length !== 1) {
      results.push({
        fileName,
        status: samples.length > 0 ? "ambiguous" : "unmatched",
        sampleIds: samples.map(({ id }) => id),
      });
      continue;
    }
    const sample = samples[0];
    const source = sources[0];
    if (!sample || !source) continue;
    const linked = await relinkSource(current, sample.id, source);
    current = linked.workflow;
    results.push(linked.result);
  }
  return { workflow: current, results };
}

export function workflowDiagnostics(workflow: ProjectWorkflow): ValidationMessage[] {
  return [
    ...workflow.project.samples.flatMap(({ validation }) => validation),
    ...validatePadAssignments(workflow.project.samples),
    ...validateSourceAvailability(workflow.project.samples.map(({ id, pad }) => ({
      id,
      pad,
      available: workflow.sources.has(id),
    }))),
    hardwareCompatibilityNotice(workflow.project.target),
  ];
}

export function summarizeWorkflow(workflow: ProjectWorkflow): ProjectSummary {
  const diagnostics = workflowDiagnostics(workflow);
  return {
    total: workflow.project.samples.length,
    assigned: workflow.project.samples.filter(({ pad }) => pad !== null).length,
    unassigned: workflow.project.samples.filter(({ pad }) => pad === null).length,
    errors: diagnostics.filter(({ severity }) => severity === "error").length,
    warnings: diagnostics.filter(({ severity }) => severity === "warning").length,
    missingSources: workflow.project.samples.filter(({ id }) => !workflow.sources.has(id)).length,
  };
}
