import { isPadId, type PadId } from "@sp404-toolkit/core";

export type ManifestSampleV1 = {
  pad: PadId | null;
  file: string;
  name: string;
};

export type ManifestV1 = {
  version: 1;
  target: "SP404SX";
  samples: ManifestSampleV1[];
};

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseManifest(input: string | unknown): ManifestV1 {
  let value: unknown;
  try {
    value = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    throw new ManifestError("Manifest is not valid JSON.");
  }

  if (!isRecord(value)) throw new ManifestError("Manifest must be an object.");
  if (value.version !== 1) throw new ManifestError("Only manifest version 1 is supported.");
  if (value.target !== "SP404SX") throw new ManifestError("Only the SP404SX target is supported.");
  if (!Array.isArray(value.samples)) throw new ManifestError("Manifest samples must be an array.");

  const usedPads = new Set<PadId>();
  const samples = value.samples.map((sample, index): ManifestSampleV1 => {
    if (!isRecord(sample)) throw new ManifestError(`Sample ${index} must be an object.`);
    if (typeof sample.file !== "string" || sample.file.trim() === "") {
      throw new ManifestError(`Sample ${index} needs a non-empty file.`);
    }
    if (typeof sample.name !== "string" || sample.name.trim() === "") {
      throw new ManifestError(`Sample ${index} needs a non-empty name.`);
    }
    if (sample.pad !== null && (typeof sample.pad !== "string" || !isPadId(sample.pad))) {
      throw new ManifestError(`Sample ${index} has an invalid pad.`);
    }
    const pad = sample.pad === null ? null : (sample.pad.toUpperCase() as PadId);
    if (pad && usedPads.has(pad)) throw new ManifestError(`Pad ${pad} is assigned more than once.`);
    if (pad) usedPads.add(pad);
    return { pad, file: sample.file, name: sample.name };
  });

  if (samples.length > 120) throw new ManifestError("A manifest cannot contain more than 120 samples.");
  return { version: 1, target: "SP404SX", samples };
}

export function serializeManifest(manifest: ManifestV1): string {
  return `${JSON.stringify(parseManifest(manifest), null, 2)}\n`;
}
