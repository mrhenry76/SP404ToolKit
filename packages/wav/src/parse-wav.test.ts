import { describe, expect, it } from "vitest";
import { getPcmBytes, parseWav, WavParseError } from "./parse-wav.js";

const ascii = (value: string) => Array.from(value, (character) => character.charCodeAt(0));

function chunk(id: string, body: number[]): number[] {
  const size = body.length;
  return [
    ...ascii(id),
    size & 0xff,
    (size >>> 8) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 24) & 0xff,
    ...body,
    ...(size % 2 ? [0] : []),
  ];
}

function riff(body: number[]): Uint8Array {
  const riffSize = body.length + 4;
  return new Uint8Array([
    ...ascii("RIFF"),
    riffSize & 0xff,
    (riffSize >>> 8) & 0xff,
    (riffSize >>> 16) & 0xff,
    (riffSize >>> 24) & 0xff,
    ...ascii("WAVE"),
    ...body,
  ]);
}

function makeWav(options: { fmtSize?: 16 | 18; beforeFmt?: number[]; pcm?: number[] } = {}): Uint8Array {
  const fmt = [
    1, 0, // PCM
    1, 0, // mono
    0x44, 0xac, 0, 0, // 44100 Hz
    0x88, 0x58, 0x01, 0, // 88200 bytes/s
    2, 0, // block align
    16, 0, // bit depth
    ...(options.fmtSize === 18 ? [0, 0] : []),
  ];
  const body = [
    ...(options.beforeFmt ?? []),
    ...chunk("fmt ", fmt),
    ...chunk("data", options.pcm ?? [0, 0, 1, 0]),
  ];
  return riff(body);
}

describe("parseWav", () => {
  it("reads PCM metadata, duration and bytes", () => {
    const input = makeWav();
    const original = input.slice();
    const wav = parseWav(input);
    expect(wav.format).toEqual({
      audioFormat: 1,
      channels: 1,
      sampleRate: 44100,
      byteRate: 88200,
      blockAlign: 2,
      bitDepth: 16,
      extraSize: 0,
    });
    expect(wav.durationSeconds).toBeCloseTo(2 / 44100);
    expect(Array.from(getPcmBytes(input, wav))).toEqual([0, 0, 1, 0]);
    expect(input).toEqual(original);
  });

  it("handles unknown odd chunks, padding and an 18-byte fmt chunk", () => {
    const wav = parseWav(makeWav({ fmtSize: 18, beforeFmt: chunk("JUNK", [1, 2, 3]) }));
    expect(wav.chunks.map(({ id }) => id)).toEqual(["JUNK", "fmt ", "data"]);
    expect(wav.format.extraSize).toBe(0);
  });

  it("rejects a truncated RIFF", () => {
    const input = makeWav();
    expect(() => parseWav(input.subarray(0, -1))).toThrowError(WavParseError);
    try {
      parseWav(input.subarray(0, -1));
    } catch (error) {
      expect((error as WavParseError).code).toBe("TRUNCATED_RIFF");
    }
  });

  it("rejects missing required chunks", () => {
    const body = chunk("data", [0, 0]);
    const input = new Uint8Array([...ascii("RIFF"), body.length + 4, 0, 0, 0, ...ascii("WAVE"), ...body]);
    expect(() => parseWav(input)).toThrowError(/fmt chunk/);
  });

  it("rejects a truncated fmt chunk", () => {
    const input = makeWav();
    new DataView(input.buffer).setUint32(16, 15, true);
    expect(() => parseWav(input)).toThrowError(/shorter than 16 bytes/);
  });

  it("rejects a truncated chunk header", () => {
    const valid = makeWav();
    const fmtChunk = Array.from(valid.subarray(12, 36));
    expect(() => parseWav(riff([...fmtChunk, 1, 2, 3, 4]))).toThrowError(/header.*truncated/i);
  });

  it("rejects truncated chunk data", () => {
    const input = makeWav();
    new DataView(input.buffer).setUint32(40, 10, true);
    expect(() => parseWav(input)).toThrowError(/data.*truncated/i);
  });

  it("rejects missing padding after an odd unknown chunk", () => {
    const valid = makeWav();
    const body = Array.from(valid.subarray(12));
    const oddWithoutPadding = [...ascii("JUNK"), 3, 0, 0, 0, 1, 2, 3];
    expect(() => parseWav(riff([...body, ...oddWithoutPadding]))).toThrowError(/padding/i);
  });
});
