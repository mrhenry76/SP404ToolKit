#!/usr/bin/env node
import path from "node:path";
import { INITIAL_FIXTURES, writeGeneratedFixture, writeInitialFixtures, type SignalType } from "../generator.js";
import { optionNumber, optionString, parseArgs } from "./args.js";

const SIGNALS = new Set<SignalType>(["silence", "impulse", "constant", "ascending", "sine", "stereo-channel-id"]);

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const preset = optionString(args, "preset");
  if (preset !== undefined) {
    if (preset !== "initial") throw new Error("Only --preset initial is supported.");
    const outputDirectory = optionString(args, "output-dir") ?? "fixtures/source";
    await writeInitialFixtures(outputDirectory);
    console.log(`Generated ${INITIAL_FIXTURES.length} deterministic WAV fixtures and metadata records in ${path.resolve(outputDirectory)}`);
    return;
  }

  const signal = optionString(args, "signal") as SignalType | undefined;
  const frames = optionNumber(args, "frames");
  const output = optionString(args, "output");
  const channelValue = optionString(args, "channels") ?? "mono";
  const channels = channelValue === "mono" || channelValue === "1" ? 1 : channelValue === "stereo" || channelValue === "2" ? 2 : null;
  if (!signal || !SIGNALS.has(signal) || frames === undefined || !output || channels === null) {
    throw new Error("Usage: --signal <type> --frames <count> --channels mono|stereo --output <file.wav> [--frequency 440] [--amplitude 0.5] [--impulse-frame 0]");
  }
  const generated = await writeGeneratedFixture(output, {
    signalType: signal,
    frames,
    channels,
    frequencyHz: optionNumber(args, "frequency"),
    amplitude: optionNumber(args, "amplitude"),
    impulseFrame: optionNumber(args, "impulse-frame"),
    constantValue: optionNumber(args, "value"),
    ascendingStart: optionNumber(args, "start"),
    ascendingStep: optionNumber(args, "step"),
  });
  console.log(JSON.stringify(generated.metadata, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
