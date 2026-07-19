import type { PadId } from "./pads.js";

export type ProjectTarget = "SP404SX" | "SP404A";

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationCategory = "wav-structure" | "technical" | "mapping" | "source" | "compatibility";

export type ValidationMessage = {
  severity: ValidationSeverity;
  category: ValidationCategory;
  code: string;
  message: string;
  sampleId?: string;
  pad?: PadId;
  suggestedAction?: string;
};

export type SampleMetadata = {
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
  durationSeconds?: number;
  samplePeakDbfs?: number;
  audioFormat?: number;
};

/** Serializable sample data. Binary sources are held separately by adapters. */
export type SampleAsset = {
  id: string;
  fileName: string;
  displayName: string;
  pad: PadId | null;
  metadata: SampleMetadata;
  validation: ValidationMessage[];
};

export type ToolkitProject = {
  schemaVersion: 1;
  target: ProjectTarget;
  samples: SampleAsset[];
};
