import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { writePcm16Wav } from "@sp404-toolkit/wav";
import { sha256 } from "./hash.js";

export const GENERATOR_VERSION = "0.2.0" as const;
export const FIXTURE_SCHEMA_VERSION = 1 as const;
export const LAB_SAMPLE_RATE = 44_100 as const;
export const LAB_BIT_DEPTH = 16 as const;

export type SignalType = "silence" | "impulse" | "constant" | "ascending" | "sine" | "stereo-channel-id";

export type GeneratorOptions = {
  signalType: SignalType;
  frames: number;
  channels: 1 | 2;
  frequencyHz?: number | undefined;
  amplitude?: number | undefined;
  impulseFrame?: number | undefined;
  constantValue?: number | undefined;
  ascendingStart?: number | undefined;
  ascendingStep?: number | undefined;
};

export type FixtureMetadataV1 = {
  schemaVersion: 1;
  generatorVersion: string;
  signalType: SignalType;
  parameters: {
    frequencyHz: number;
    amplitude: number;
    impulseFrame: number;
    constantValue: number;
    ascendingStart: number;
    ascendingStep: number;
  };
  sampleRate: 44100;
  bitDepth: 16;
  channels: 1 | 2;
  frames: number;
  fileSize: number;
  sha256: string;
};

export type GeneratedFixture = {
  wav: Uint8Array;
  samples: Int16Array;
  metadata: FixtureMetadataV1;
};

function assertInteger(name: string, value: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
}

function amplitudeToPcm(amplitude: number): number {
  if (!Number.isFinite(amplitude) || amplitude < 0 || amplitude > 1) {
    throw new RangeError("Amplitude must be between 0 and 1.");
  }
  return Math.round(amplitude * 32_767);
}

function clampPcm16(value: number): number {
  return Math.max(-32_768, Math.min(32_767, Math.round(value)));
}

export function generatePcm16Fixture(options: GeneratorOptions): GeneratedFixture {
  const {
    signalType,
    frames,
    channels,
    frequencyHz = 440,
    amplitude = 0.5,
    impulseFrame = 0,
    constantValue = 1_000,
    ascendingStart = -Math.floor(frames / 2),
    ascendingStep = 1,
  } = options;

  assertInteger("Frames", frames, 1);
  if (channels !== 1 && channels !== 2) throw new RangeError("Channels must be one or two.");
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || frequencyHz >= LAB_SAMPLE_RATE / 2) {
    throw new RangeError("Sine frequency must be above zero and below Nyquist.");
  }
  assertInteger("Impulse frame", impulseFrame, 0, frames - 1);
  assertInteger("Constant value", constantValue, -32_768, 32_767);
  assertInteger("Ascending start", ascendingStart, -32_768, 32_767);
  assertInteger("Ascending step", ascendingStep, -65_535, 65_535);
  if (signalType === "stereo-channel-id" && channels !== 2) {
    throw new RangeError("stereo-channel-id requires two channels.");
  }

  const samples = new Int16Array(frames * channels);
  const peak = amplitudeToPcm(amplitude);

  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      let value = 0;
      switch (signalType) {
        case "silence":
          value = 0;
          break;
        case "impulse":
          value = frame === impulseFrame ? peak : 0;
          break;
        case "constant":
          value = constantValue;
          break;
        case "ascending":
          value = ascendingStart + frame * ascendingStep;
          break;
        case "sine": {
          const phase = channel === 0 ? 0 : Math.PI / 2;
          value = peak * Math.sin((2 * Math.PI * frequencyHz * frame) / LAB_SAMPLE_RATE + phase);
          break;
        }
        case "stereo-channel-id":
          value = channel === 0 ? frame + 1 : -(frame + 1);
          break;
      }
      samples[frame * channels + channel] = clampPcm16(value);
    }
  }

  const wav = writePcm16Wav({ channels, sampleRate: LAB_SAMPLE_RATE, samples });
  const metadata: FixtureMetadataV1 = {
    schemaVersion: FIXTURE_SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    signalType,
    parameters: { frequencyHz, amplitude, impulseFrame, constantValue, ascendingStart, ascendingStep },
    sampleRate: LAB_SAMPLE_RATE,
    bitDepth: LAB_BIT_DEPTH,
    channels,
    frames,
    fileSize: wav.byteLength,
    sha256: sha256(wav),
  };
  return { wav, samples, metadata };
}

export async function writeGeneratedFixture(outputPath: string, options: GeneratorOptions): Promise<GeneratedFixture> {
  const generated = generatePcm16Fixture(options);
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, generated.wav);
  const metadataPath = resolved.toLowerCase().endsWith(".wav") ? `${resolved.slice(0, -4)}.json` : `${resolved}.json`;
  await writeFile(metadataPath, `${JSON.stringify(generated.metadata, null, 2)}\n`, "utf8");
  return generated;
}

export const INITIAL_FIXTURES: ReadonlyArray<{ fileName: string; options: GeneratorOptions }> = [
  { fileName: "mono-silence-100f.wav", options: { signalType: "silence", frames: 100, channels: 1 } },
  { fileName: "mono-impulse-100f.wav", options: { signalType: "impulse", frames: 100, channels: 1, impulseFrame: 0, amplitude: 1 } },
  { fileName: "mono-ascending-100f.wav", options: { signalType: "ascending", frames: 100, channels: 1, ascendingStart: -50 } },
  { fileName: "stereo-channel-id-100f.wav", options: { signalType: "stereo-channel-id", frames: 100, channels: 2 } },
  { fileName: "mono-sine-1000f.wav", options: { signalType: "sine", frames: 1_000, channels: 1, frequencyHz: 440, amplitude: 0.5 } },
  { fileName: "stereo-sine-1000f.wav", options: { signalType: "sine", frames: 1_000, channels: 2, frequencyHz: 440, amplitude: 0.5 } },
];

export async function writeInitialFixtures(outputDirectory: string): Promise<GeneratedFixture[]> {
  const results: GeneratedFixture[] = [];
  for (const fixture of INITIAL_FIXTURES) {
    results.push(await writeGeneratedFixture(path.join(outputDirectory, fixture.fileName), fixture.options));
  }
  return results;
}
