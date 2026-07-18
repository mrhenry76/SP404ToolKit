import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";

export const EVIDENCE_STATES = ["CONFIRMED", "OBSERVED", "HYPOTHESIS", "UNKNOWN"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export type ExperimentRecordV1 = {
  schemaVersion: 1;
  experimentId: string;
  createdAt: string;
  operator: string;
  status: EvidenceState;
  changedVariable: string;
  source: {
    path: string;
    sha256: string;
    generatorVersion: string;
    parameters: Record<string, unknown>;
  };
  officialConversion: {
    converterName: string;
    converterVersion: string;
    operatingSystem: string;
    settings: Record<string, unknown>;
    outputPath: string;
    sha256: string;
  };
  hardwareVerification: {
    performed: boolean;
    model: string;
    firmware: string;
    result: string;
    notes: string;
  };
  redistribution: {
    allowed: boolean;
    basis: string;
  };
  expectedObservation: string;
  actualObservation: string;
  notes: string[];
};

const nonEmptyString = { type: "string", minLength: 1 } as const;
const sha256String = { type: "string", pattern: "^[a-f0-9]{64}$" } as const;

export const EXPERIMENT_SCHEMA_V1 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:sp404-toolkit:schema:experiment:1",
  title: "SP404 Toolkit reverse-engineering experiment v1",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion", "experimentId", "createdAt", "operator", "status", "changedVariable",
    "source", "officialConversion", "hardwareVerification", "redistribution",
    "expectedObservation", "actualObservation", "notes",
  ],
  properties: {
    schemaVersion: { const: 1 },
    experimentId: nonEmptyString,
    createdAt: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$" },
    operator: nonEmptyString,
    status: { enum: EVIDENCE_STATES },
    changedVariable: nonEmptyString,
    source: {
      type: "object",
      additionalProperties: false,
      required: ["path", "sha256", "generatorVersion", "parameters"],
      properties: {
        path: nonEmptyString,
        sha256: sha256String,
        generatorVersion: nonEmptyString,
        parameters: { type: "object" },
      },
    },
    officialConversion: {
      type: "object",
      additionalProperties: false,
      required: ["converterName", "converterVersion", "operatingSystem", "settings", "outputPath", "sha256"],
      properties: {
        converterName: { type: "string" },
        converterVersion: { type: "string" },
        operatingSystem: { type: "string" },
        settings: { type: "object" },
        outputPath: { type: "string" },
        sha256: { anyOf: [sha256String, { const: "" }] },
      },
    },
    hardwareVerification: {
      type: "object",
      additionalProperties: false,
      required: ["performed", "model", "firmware", "result", "notes"],
      properties: {
        performed: { type: "boolean" },
        model: { type: "string" },
        firmware: { type: "string" },
        result: { type: "string" },
        notes: { type: "string" },
      },
    },
    redistribution: {
      type: "object",
      additionalProperties: false,
      required: ["allowed", "basis"],
      properties: {
        allowed: { type: "boolean" },
        basis: { type: "string" },
      },
    },
    expectedObservation: { type: "string" },
    actualObservation: { type: "string" },
    notes: { type: "array", items: { type: "string" } },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile<ExperimentRecordV1>(EXPERIMENT_SCHEMA_V1);

export type ExperimentValidationResult = {
  valid: boolean;
  errors: ErrorObject[];
};

export function validateExperimentRecord(value: unknown): ExperimentValidationResult {
  const valid = validate(value);
  return { valid, errors: valid ? [] : [...(validate.errors ?? [])] };
}

export function assertExperimentRecord(value: unknown): asserts value is ExperimentRecordV1 {
  const result = validateExperimentRecord(value);
  if (!result.valid) {
    const message = result.errors.map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`).join("; ");
    throw new Error(`Invalid experiment record: ${message}`);
  }
}
