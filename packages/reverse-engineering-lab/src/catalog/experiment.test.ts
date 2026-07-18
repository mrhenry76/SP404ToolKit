import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EXPERIMENT_SCHEMA_V1, assertExperimentRecord, validateExperimentRecord, type ExperimentRecordV1 } from "./experiment.js";

const validRecord: ExperimentRecordV1 = {
  schemaVersion: 1,
  experimentId: "batch-001-mono-impulse-a1",
  createdAt: "2026-07-18T12:00:00Z",
  operator: "Example operator",
  status: "UNKNOWN",
  changedVariable: "baseline",
  source: {
    path: "fixtures/source/mono-impulse-100f.wav",
    sha256: "a".repeat(64),
    generatorVersion: "0.2.0",
    parameters: { frames: 100, channels: 1 },
  },
  officialConversion: {
    converterName: "",
    converterVersion: "",
    operatingSystem: "",
    settings: {},
    outputPath: "",
    sha256: "",
  },
  hardwareVerification: { performed: false, model: "", firmware: "", result: "", notes: "" },
  redistribution: { allowed: false, basis: "Awaiting provenance review" },
  expectedObservation: "",
  actualObservation: "",
  notes: [],
};

describe("experiment catalog schema v1", () => {
  it("keeps the published JSON Schema synchronized with the validator", () => {
    const published = JSON.parse(readFileSync(new URL("../../schema/experiment-v1.schema.json", import.meta.url), "utf8"));
    expect(published).toEqual(EXPERIMENT_SCHEMA_V1);
  });

  it("accepts a complete version 1 record", () => {
    expect(validateExperimentRecord(validRecord)).toEqual({ valid: true, errors: [] });
    expect(() => assertExperimentRecord(validRecord)).not.toThrow();
  });

  it.each(["READY", "confirmed", ""])("rejects unsupported status %s", (status) => {
    expect(validateExperimentRecord({ ...validRecord, status }).valid).toBe(false);
  });

  it("rejects missing fields, malformed hashes and extra properties", () => {
    const { operator: _operator, ...missing } = validRecord;
    expect(validateExperimentRecord(missing).valid).toBe(false);
    expect(validateExperimentRecord({ ...validRecord, source: { ...validRecord.source, sha256: "bad" } }).valid).toBe(false);
    expect(validateExperimentRecord({ ...validRecord, unexpected: true }).valid).toBe(false);
  });
});
