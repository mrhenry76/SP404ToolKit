#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { validateExperimentRecord } from "../catalog/experiment.js";
import { parseArgs } from "./args.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const input = args.positionals[0];
  if (!input) throw new Error("Usage: experiment:validate <catalog-record.json>");
  const value: unknown = JSON.parse(await readFile(input, "utf8"));
  const result = validateExperimentRecord(value);
  if (!result.valid) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log("Experiment record is valid against schema version 1.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
