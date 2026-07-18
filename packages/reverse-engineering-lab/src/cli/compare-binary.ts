#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { compareBinary, renderBinaryComparison } from "../binary-compare.js";
import { parseReportFormat } from "../report-format.js";
import { optionFlag, optionNumber, optionString, parseArgs } from "./args.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const [fileA, fileB] = args.positionals;
  if (!fileA || !fileB) throw new Error("Usage: binary:compare <file-a> <file-b> [--context 8] [--interpret] [--format human|json|markdown]");
  const [inputA, inputB] = await Promise.all([readFile(fileA), readFile(fileB)]);
  const report = compareBinary(inputA, inputB, {
    contextBytes: optionNumber(args, "context"),
    includeInterpretations: optionFlag(args, "interpret"),
  });
  process.stdout.write(renderBinaryComparison(report, parseReportFormat(optionString(args, "format"))));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
