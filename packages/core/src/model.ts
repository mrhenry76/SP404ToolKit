import type { PadId } from "./pads.js";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationMessage = {
  severity: ValidationSeverity;
  code: string;
  message: string;
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
  target: "SP404SX";
  samples: SampleAsset[];
};
