#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parsePadInfo } from "../parse-pad-info.js";
import { parsePadInfoOutputFormat, renderPadInfo } from "../render.js";

type ParsedArgs = {
  input?: string | undefined;
  format?: string | undefined;
  occupiedOnly: boolean;
  pad?: string | undefined;
};

function parseArgs(argv: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = { occupiedOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--occupied-only") {
      parsed.occupiedOnly = true;
    } else if (value === "--format" || value === "--pad") {
      const optionValue = argv[index + 1];
      if (optionValue === undefined || optionValue.startsWith("--")) throw new Error(`${value} requires a value.`);
      if (value === "--format") parsed.format = optionValue;
      else parsed.pad = optionValue;
      index += 1;
    } else if (value?.startsWith("--")) {
      throw new Error(`Unknown option: ${value}.`);
    } else if (value !== undefined && parsed.input === undefined) {
      parsed.input = value;
    } else if (value !== undefined) {
      throw new Error(`Unexpected argument: ${value}.`);
    }
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Usage: pad-info:analyze <PAD_INFO.BIN> [--format human|json|markdown] [--occupied-only] [--pad A1]");
  }
  const analysis = parsePadInfo(await readFile(args.input));
  process.stdout.write(renderPadInfo(analysis, {
    format: parsePadInfoOutputFormat(args.format),
    occupiedOnly: args.occupiedOnly,
    pad: args.pad,
  }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
