import type {
  AutomaticPadAssignment,
  PadId,
  ProjectTarget,
  ValidationMessage,
} from "@sp404-toolkit/core";
import { WavParseError, type ParsedWav } from "@sp404-toolkit/wav";

export type ValidationContext = {
  sampleId?: string;
  pad?: PadId | null;
};

function withContext(
  message: Omit<ValidationMessage, "sampleId" | "pad">,
  context: ValidationContext,
): ValidationMessage {
  return {
    ...message,
    ...(context.sampleId ? { sampleId: context.sampleId } : {}),
    ...(context.pad ? { pad: context.pad } : {}),
  };
}

export function validateWav(wav: ParsedWav, context: ValidationContext = {}): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  if (!wav.isPcm) messages.push(withContext({
    severity: "error",
    category: "technical",
    code: "WAV_NOT_PCM",
    message: "The WAV is not linear PCM.",
    suggestedAction: "Choose a linear PCM WAV source.",
  }, context));
  if (wav.data.size === 0) messages.push(withContext({
    severity: "error",
    category: "technical",
    code: "WAV_EMPTY",
    message: "The WAV contains no audio data.",
    suggestedAction: "Choose a WAV that contains at least one audio frame.",
  }, context));
  if (wav.data.size % wav.format.blockAlign !== 0) messages.push(withContext({
    severity: "error",
    category: "wav-structure",
    code: "WAV_FRAME_ALIGNMENT",
    message: "The PCM data size is not aligned to a complete audio frame.",
    suggestedAction: "Choose a structurally valid WAV with complete audio frames.",
  }, context));
  if (wav.format.channels > 2) messages.push(withContext({
    severity: "warning",
    category: "technical",
    code: "WAV_CHANNELS",
    message: "The WAV has more than two channels; hardware compatibility is not asserted.",
    suggestedAction: "Review the source format before using this project on hardware.",
  }, context));
  return messages;
}

export function validationMessageForWavError(
  error: unknown,
  context: ValidationContext,
): ValidationMessage {
  const code = error instanceof WavParseError ? error.code : "WAV_READ_FAILED";
  const message = error instanceof Error ? error.message : "The WAV could not be read.";
  return withContext({
    severity: "error",
    category: "wav-structure",
    code,
    message,
    suggestedAction: "Choose a structurally valid RIFF/WAVE file.",
  }, context);
}

export function validatePadAssignments(
  assignments: ReadonlyArray<{ id?: string; pad: PadId | null }>,
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const seen = new Map<PadId, string | undefined>();
  if (assignments.length > 120) {
    messages.push({
      severity: "error",
      category: "mapping",
      code: "PAD_LIMIT",
      message: "A project cannot assign more than 120 samples to pads.",
      suggestedAction: "Leave samples beyond the 120-pad limit unassigned or remove them from the project.",
    });
  }
  for (const { id, pad } of assignments) {
    if (pad === null) {
      messages.push(withContext({
        severity: "error",
        category: "mapping",
        code: "PAD_UNASSIGNED",
        message: "The sample is not assigned to a pad.",
        suggestedAction: "Choose a free pad explicitly.",
      }, { ...(id ? { sampleId: id } : {}) }));
    } else if (seen.has(pad)) {
      messages.push(withContext({
        severity: "error",
        category: "mapping",
        code: "PAD_DUPLICATE",
        message: `Pad ${pad} is assigned more than once.`,
        suggestedAction: "Choose a free pad or unassign the current occupant first.",
      }, { ...(id ? { sampleId: id } : {}), pad }));
    } else {
      seen.set(pad, id);
    }
  }
  return messages;
}

export function validateAutomaticPadAssignment(
  assignment: AutomaticPadAssignment,
  sampleId: string,
): ValidationMessage[] {
  if (assignment.status === "assigned") return [];
  if (assignment.status === "unassigned") {
    return [{
      severity: "error",
      category: "mapping",
      code: "PAD_EXHAUSTED",
      message: "No free pad is available for this sample.",
      sampleId,
      suggestedAction: "Unassign another sample or remove this sample from the project.",
    }];
  }
  return [{
    severity: "info",
    category: "mapping",
    code: "AUTO_PAD_FALLBACK",
    message: assignment.reason === "PAD_OCCUPIED"
      ? `Requested pad ${assignment.requestedPad} was occupied; assigned ${assignment.pad} instead.`
      : `No pad was recognized in the filename; assigned ${assignment.pad}.`,
    sampleId,
    pad: assignment.pad,
    suggestedAction: "Review the automatic assignment and change it explicitly if needed.",
  }];
}

export function validateSourceAvailability(
  sources: ReadonlyArray<{ id: string; pad: PadId | null; available: boolean }>,
): ValidationMessage[] {
  return sources.flatMap(({ id, pad, available }) => available ? [] : [withContext({
    severity: "warning",
    category: "source",
    code: "SOURCE_MISSING",
    message: "The local WAV source is not linked in this browser session.",
    suggestedAction: "Relink the matching local WAV file explicitly.",
  }, { sampleId: id, pad })]);
}

export function hardwareCompatibilityNotice(target: ProjectTarget): ValidationMessage {
  return {
    severity: "info",
    category: "compatibility",
    code: "HARDWARE_COMPATIBILITY_UNVERIFIED",
    message: `${target} is a project target only; hardware-compatible Roland export is not available.`,
  };
}
