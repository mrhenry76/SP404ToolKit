import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPcmBytes, parseWav } from "@sp404-toolkit/wav";
import {
  BATCH_001_FIXTURES,
  DURATION_THRESHOLD_FIXTURES,
  generatePcm16Fixture,
  INITIAL_FIXTURES,
  LAB_SAMPLE_RATE,
  writeGeneratedFixture,
  writeInitialFixtures,
} from "./generator.js";

function int16Values(bytes: Uint8Array): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.byteLength / 2 }, (_, index) => view.getInt16(index * 2, true));
}

describe("deterministic PCM16 fixture generator", () => {
  it("writes canonical RIFF, fmt and data headers with exact sizes", () => {
    const generated = generatePcm16Fixture({ signalType: "silence", frames: 100, channels: 1 });
    const text = (start: number, end: number) => new TextDecoder("ascii").decode(generated.wav.subarray(start, end));
    const view = new DataView(generated.wav.buffer);
    expect(text(0, 4)).toBe("RIFF");
    expect(view.getUint32(4, true)).toBe(generated.wav.length - 8);
    expect(text(8, 12)).toBe("WAVE");
    expect(text(12, 16)).toBe("fmt ");
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(text(36, 40)).toBe("data");
    expect(view.getUint32(40, true)).toBe(200);
    expect(generated.wav).toHaveLength(244);
  });

  it("preserves exact frame count and PCM metadata", () => {
    const generated = generatePcm16Fixture({ signalType: "constant", frames: 37, channels: 2, constantValue: -1234 });
    const wav = parseWav(generated.wav);
    expect(wav.format).toMatchObject({ audioFormat: 1, channels: 2, sampleRate: 44_100, bitDepth: 16, blockAlign: 4 });
    expect(wav.data.size / wav.format.blockAlign).toBe(37);
    expect(int16Values(getPcmBytes(generated.wav, wav))).toEqual(Array(74).fill(-1234));
  });

  it("places one impulse at the configured frame", () => {
    const generated = generatePcm16Fixture({ signalType: "impulse", frames: 5, channels: 1, impulseFrame: 3, amplitude: 1 });
    expect(Array.from(generated.samples)).toEqual([0, 0, 0, 32_767, 0]);
  });

  it("generates known ascending values", () => {
    const generated = generatePcm16Fixture({ signalType: "ascending", frames: 5, channels: 1, ascendingStart: -2, ascendingStep: 1 });
    expect(Array.from(generated.samples)).toEqual([-2, -1, 0, 1, 2]);
  });

  it("interleaves distinct stereo channel-identification values", () => {
    const generated = generatePcm16Fixture({ signalType: "stereo-channel-id", frames: 4, channels: 2 });
    expect(Array.from(generated.samples)).toEqual([1, -1, 2, -2, 3, -3, 4, -4]);
    expect(int16Values(getPcmBytes(generated.wav))).toEqual([1, -1, 2, -2, 3, -3, 4, -4]);
  });

  it("uses different phases for stereo sine channels", () => {
    const generated = generatePcm16Fixture({ signalType: "sine", frames: 2, channels: 2, frequencyHz: 440, amplitude: 0.5 });
    expect(generated.samples[0]).toBe(0);
    expect(generated.samples[1]).toBe(16_384);
    expect(generated.samples[2]).not.toBe(generated.samples[3]);
  });

  it("is byte-identical and records the actual SHA-256", () => {
    const options = { signalType: "sine", frames: 5_000, channels: 1, frequencyHz: 440, amplitude: 0.5 } as const;
    const first = generatePcm16Fixture(options);
    const second = generatePcm16Fixture(options);
    expect(first.wav).toEqual(second.wav);
    expect(first.metadata).toEqual(second.metadata);
    expect(first.metadata.sha256).toBe(createHash("sha256").update(first.wav).digest("hex"));
  });

  it("locks the cross-platform hashes of the initial fixture set", () => {
    expect(INITIAL_FIXTURES.map(({ options }) => generatePcm16Fixture(options).metadata.sha256)).toEqual([
      "281ddc54f0cbb70817abec92a7e806bec56f4a72344983c5557d2b090ec4f49f",
      "2d4e969b795208e1a0d4e4a6100de7fbfd3510d5ee7491f95aa1092c0436628c",
      "4e4f8d80061354c2954d315edf2e3d9dc56bcb408d0f93ac59ec51f5312b60a0",
      "01d62891bd5ca90aa61dd413dbbecb78c7a03275dd9dbd4827dcb654c46f825d",
      "980c00d65af632028d60347cc17221accaa952ca1b5d0af271e80b2aaccf873e",
      "7b28e06aaa2d6d33be93de60aadfac356dbffec1c0822496452a40b22bda8fee",
    ]);
    expect(DURATION_THRESHOLD_FIXTURES.map(({ options }) => generatePcm16Fixture(options).metadata.sha256)).toEqual([
      "88a48b37a58a05299851a5b66d315880645ea5594be5ea3daa10486d186e69db",
      "f971a9aaa8626894132d1d3d7139e0f06b01f3beb894f680f5033eccfbbcd969",
      "5a18f07df252b1ac3953e847de9df010cd0c40ab8bc855798544f895275a860b",
      "556bb71034da8a0bebb92c690bb7bf641709317d807116eb0501e7a69305f5d7",
      "281ddc54f0cbb70817abec92a7e806bec56f4a72344983c5557d2b090ec4f49f",
    ]);
  });

  it("uses exact frame counts and derived durations for Batch 001", () => {
    for (const fixture of BATCH_001_FIXTURES) {
      const generated = generatePcm16Fixture(fixture.options);
      expect(generated.metadata.frames).toBe(5_000);
      expect(generated.metadata.frames / generated.metadata.sampleRate).toBeCloseTo(50 / 441, 15);
      expect((generated.metadata.frames * 1_000) / generated.metadata.sampleRate).toBeCloseTo(113.37868480725623, 12);
      expect(fixture.fileName).toMatch(/-5000f\.wav$/);
    }
  });

  it("keeps the duration-threshold matrix exact and separate", () => {
    expect(DURATION_THRESHOLD_FIXTURES.map(({ options }) => options.frames)).toEqual([4_409, 4_410, 4_411, 4_500, 5_000]);
    expect(DURATION_THRESHOLD_FIXTURES.map(({ options }) => (options.frames * 1_000) / LAB_SAMPLE_RATE)).toEqual([
      99.97732426303855,
      100,
      100.02267573696145,
      102.04081632653062,
      113.37868480725623,
    ]);
  });

  it("writes coherent file names and metadata for all generated sets", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "sp404-fixture-set-"));
    try {
      const generated = await writeInitialFixtures(directory);
      expect(generated).toHaveLength(INITIAL_FIXTURES.length + DURATION_THRESHOLD_FIXTURES.length);
      for (const [subdirectory, fixtures] of [["", INITIAL_FIXTURES], ["duration-threshold", DURATION_THRESHOLD_FIXTURES]] as const) {
        for (const fixture of fixtures) {
          const baseName = fixture.fileName.slice(0, -4);
          const metadata = JSON.parse(await readFile(path.join(directory, subdirectory, `${baseName}.json`), "utf8"));
          const wavBytes = await readFile(path.join(directory, subdirectory, fixture.fileName));
          const wav = parseWav(wavBytes);
          expect(metadata.frames).toBe(fixture.options.frames);
          expect(metadata.fileSize).toBe(wavBytes.byteLength);
          expect(metadata.sha256).toBe(createHash("sha256").update(wavBytes).digest("hex"));
          expect(wav.data.size / wav.format.blockAlign).toBe(fixture.options.frames);
          expect(fixture.fileName).toContain(`${metadata.frames}f.wav`);
        }
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite fixture files unless explicitly allowed", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "sp404-fixture-"));
    const output = path.join(directory, "fixture.wav");
    const firstOptions = { signalType: "silence", frames: 4, channels: 1 } as const;
    const secondOptions = { signalType: "constant", frames: 4, channels: 1, constantValue: 123 } as const;
    try {
      await writeGeneratedFixture(output, firstOptions);
      const original = await readFile(output);
      await expect(writeGeneratedFixture(output, secondOptions)).rejects.toThrow("Refusing to overwrite");
      expect(await readFile(output)).toEqual(original);

      const replacement = await writeGeneratedFixture(output, secondOptions, { overwrite: true });
      expect(await readFile(output)).toEqual(Buffer.from(replacement.wav));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
