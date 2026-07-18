import type { PadId, ValidationMessage } from "@sp404-toolkit/core";
import type { ParsedWav } from "@sp404-toolkit/wav";

export function validateWav(wav: ParsedWav): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  if (!wav.isPcm) messages.push({ severity: "error", code: "WAV_NOT_PCM", message: "The WAV is not linear PCM." });
  if (wav.data.size === 0) messages.push({ severity: "error", code: "WAV_EMPTY", message: "The WAV contains no audio data." });
  if (wav.format.channels > 2) messages.push({ severity: "warning", code: "WAV_CHANNELS", message: "The WAV has more than two channels." });
  return messages;
}

export function validatePadAssignments(assignments: ReadonlyArray<{ pad: PadId | null }>): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const seen = new Set<PadId>();
  if (assignments.length > 120) {
    messages.push({ severity: "error", code: "PAD_LIMIT", message: "A project cannot contain more than 120 samples." });
  }
  for (const { pad } of assignments) {
    if (pad === null) {
      messages.push({ severity: "error", code: "PAD_UNASSIGNED", message: "A sample is not assigned to a pad." });
    } else if (seen.has(pad)) {
      messages.push({ severity: "error", code: "PAD_DUPLICATE", message: `Pad ${pad} is assigned more than once.` });
    } else {
      seen.add(pad);
    }
  }
  return messages;
}
