#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { inspectWav, renderWavInspection } from "../inspector.js";
import { parseReportFormat } from "../report-format.js";
import { optionFlag, optionNumber, optionString, parseArgs } from "./args.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const input = optionString(args, "input") ?? args.positionals[0];
  if (!input) throw new Error("Usage: wav:inspect <file.wav> [--format human|json|markdown] [--hex] [--hex-limit 256]");
  const bytes = await readFile(input);
  const report = inspectWav(bytes, {
    includeHexDump: optionFlag(args, "hex"),
    hexDumpLimit: optionNumber(args, "hex-limit"),
  });
  process.stdout.write(renderWavInspection(report, parseReportFormat(optionString(args, "format"))));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
