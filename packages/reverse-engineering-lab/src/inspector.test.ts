import { describe, expect, it } from "vitest";
import { generatePcm16Fixture } from "./generator.js";
import { inspectWav, renderWavInspection } from "./inspector.js";

function withOddUnknownChunk(wav: Uint8Array): Uint8Array {
  const unknown = new Uint8Array([82, 76, 78, 68, 3, 0, 0, 0, 0xaa, 0xbb, 0xcc, 0]);
  const output = new Uint8Array(wav.length + unknown.length);
  output.set(wav.subarray(0, 36), 0);
  output.set(unknown, 36);
  output.set(wav.subarray(36), 36 + unknown.length);
  new DataView(output.buffer).setUint32(4, output.length - 8, true);
  return output;
}

describe("WAV structure inspector", () => {
  it("reports chunks, decoded format, PCM offset, frames and hash", () => {
    const wav = generatePcm16Fixture({ signalType: "silence", frames: 100, channels: 1 }).wav;
    const report = inspectWav(wav);
    expect(report.physicalFileSize).toBe(244);
    expect(report.riffSize).toBe(236);
    expect(report.chunks.map((chunk) => chunk.id)).toEqual(["fmt ", "data"]);
    expect(report.format).toMatchObject({ audioFormat: 1, channels: 1, sampleRate: 44_100, bitDepth: 16 });
    expect(report.pcm).toMatchObject({ payloadOffset: 44, size: 200, frames: 100 });
    expect(report.pcm.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reports an unknown RLND chunk as raw bytes with padding and optional hex", () => {
    const source = generatePcm16Fixture({ signalType: "silence", frames: 2, channels: 1 }).wav;
    const report = inspectWav(withOddUnknownChunk(source), { includeHexDump: true });
    const unknown = report.chunks[1];
    expect(unknown).toMatchObject({
      id: "RLND",
      headerOffset: 36,
      dataOffset: 44,
      declaredSize: 3,
      paddingBytes: 1,
      classification: "unknown",
      hexDump: "aa bb cc",
    });
    expect(unknown?.payloadSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.pcm.payloadOffset).toBe(56);
  });

  it("renders human, JSON and Markdown reports", () => {
    const report = inspectWav(generatePcm16Fixture({ signalType: "silence", frames: 2, channels: 1 }).wav);
    expect(renderWavInspection(report, "human")).toContain("WAV structure report");
    expect(JSON.parse(renderWavInspection(report, "json"))).toEqual(report);
    expect(renderWavInspection(report, "markdown")).toContain("| ID | Offset |");
  });
});
