import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPcmBytes, parseWav } from "@sp404-toolkit/wav";
import { generatePcm16Fixture, INITIAL_FIXTURES, writeGeneratedFixture } from "./generator.js";

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
    const options = { signalType: "sine", frames: 1_000, channels: 1, frequencyHz: 440, amplitude: 0.5 } as const;
    const first = generatePcm16Fixture(options);
    const second = generatePcm16Fixture(options);
    expect(first.wav).toEqual(second.wav);
    expect(first.metadata).toEqual(second.metadata);
    expect(first.metadata.sha256).toBe(createHash("sha256").update(first.wav).digest("hex"));
  });

  it("locks the cross-platform hashes of the initial fixture set", () => {
    expect(INITIAL_FIXTURES.map(({ options }) => generatePcm16Fixture(options).metadata.sha256)).toEqual([
      "1f1f9bfb1126643502058b321bd6e3914f36a7e4ab4d66460970a1e6ec3993df",
      "65bf2634311f8295584dee19f47c60196a37905c2b0aed6acccc20433bfd5259",
      "8efa166d0ac9b2d65bd8b591082efb5edefae83ba2f7f714175453b309265177",
      "0ba654a3c074f3630fdea9af93b2205cc0a418162554b343afa06c76a78a5df7",
      "52559f051f5a7c4a9aa942a53dd1a2ce596abb70817cf257292876c4c57073a7",
      "1387610f9242be5ad90f83e149dd68104ceac39062a0ad663ba2e9c2ff929c48",
    ]);
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
