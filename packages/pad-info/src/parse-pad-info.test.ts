import { describe, expect, it } from "vitest";
import {
  PAD_INFO_EMPTY_SIZE,
  PAD_INFO_FILE_SIZE,
  PAD_INFO_FLAGS,
  PAD_INFO_FORMAT,
  PAD_INFO_RECORD_COUNT,
  PAD_INFO_RECORD_SIZE,
  parsePadInfo,
} from "./parse-pad-info.js";

type RecordValues = {
  pcmOffset?: number;
  wavSize?: number;
  pcmOffsetDuplicate?: number;
  wavSizeDuplicate?: number;
  flags?: number;
  format?: number;
  unknown24?: number;
  unknown28?: number;
};

function setSyntheticRecord(bytes: Uint8Array, index: number, values: RecordValues): void {
  const offset = index * PAD_INFO_RECORD_SIZE;
  const view = new DataView(bytes.buffer);
  const pcmOffset = values.pcmOffset ?? PAD_INFO_EMPTY_SIZE;
  const wavSize = values.wavSize ?? PAD_INFO_EMPTY_SIZE;
  view.setUint32(offset, pcmOffset, false);
  view.setUint32(offset + 4, wavSize, false);
  view.setUint32(offset + 8, values.pcmOffsetDuplicate ?? pcmOffset, false);
  view.setUint32(offset + 12, values.wavSizeDuplicate ?? wavSize, false);
  view.setUint32(offset + 16, values.flags ?? PAD_INFO_FLAGS.empty, false);
  view.setUint32(offset + 20, values.format ?? PAD_INFO_FORMAT.mono, false);
  view.setUint32(offset + 24, values.unknown24 ?? 0x0000_03fc, false);
  view.setUint32(offset + 28, values.unknown28 ?? 0x0000_03fc, false);
}

function makeSyntheticPadInfo(overrides: ReadonlyArray<[number, RecordValues]> = []): Uint8Array {
  const bytes = new Uint8Array(PAD_INFO_FILE_SIZE);
  for (let index = 0; index < PAD_INFO_RECORD_COUNT; index += 1) setSyntheticRecord(bytes, index, {});
  for (const [index, values] of overrides) setSyntheticRecord(bytes, index, values);
  return bytes;
}

describe("PAD_INFO.BIN read-only parser", () => {
  it("requires exactly 3840 bytes", () => {
    expect(() => parsePadInfo(new Uint8Array(PAD_INFO_FILE_SIZE - 1))).toThrow("exactly 3840 bytes");
    expect(() => parsePadInfo(new Uint8Array(PAD_INFO_FILE_SIZE + 1))).toThrow("exactly 3840 bytes");
  });

  it("maps record zero to A1 and record 119 to J12", () => {
    const bytes = makeSyntheticPadInfo();
    const original = bytes.slice();
    const analysis = parsePadInfo(bytes);
    expect(analysis).toMatchObject({ fileSize: 3840, recordSize: 32, recordCount: 120 });
    expect(analysis.records[0]?.pad).toBe("A1");
    expect(analysis.records[119]?.pad).toBe("J12");
    expect(analysis.records[119]?.recordOffset).toBe(119 * 32);
    expect(bytes).toEqual(original);
  });

  it.each([
    ["mono 5000", 10_512, PAD_INFO_FORMAT.mono, "mono", 1, 10_000],
    ["stereo 5000", 20_512, PAD_INFO_FORMAT.stereo, "stereo", 2, 20_000],
    ["mono 10000", 20_512, PAD_INFO_FORMAT.mono, "mono", 1, 20_000],
    ["stereo 10000", 40_512, PAD_INFO_FORMAT.stereo, "stereo", 2, 40_000],
  ] as const)("decodes an occupied %s record", (_name, wavSize, format, layout, channels, pcmBytes) => {
    const analysis = parsePadInfo(makeSyntheticPadInfo([[0, {
      flags: PAD_INFO_FLAGS.occupied,
      format,
      wavSize,
      unknown24: 0x0000_052b,
      unknown28: 0x0000_052b,
    }]]));
    expect(analysis.records[0]).toMatchObject({
      pad: "A1",
      status: "occupied",
      pcmOffset: 512,
      wavSize,
      channelLayout: layout,
      channels,
      pcmByteLength: pcmBytes,
      unknown24: 1323,
      unknown28: 1323,
      duplicateFieldsMatch: true,
      issues: [],
    });
  });

  it("decodes empty pads without assigning semantic channels", () => {
    const record = parsePadInfo(makeSyntheticPadInfo()).records[0];
    expect(record).toMatchObject({
      pad: "A1",
      status: "empty",
      wavSize: 512,
      pcmByteLength: 0,
      channelLayout: null,
      channels: null,
      flags: 0x7f00_0000,
    });
  });

  it("preserves A1/A2 order and reports both occupied records", () => {
    const occupied = { flags: PAD_INFO_FLAGS.occupied, wavSize: 10_512, unknown24: 1323, unknown28: 1323 };
    const analysis = parsePadInfo(makeSyntheticPadInfo([[0, occupied], [1, occupied]]));
    expect(analysis.records.slice(0, 2).map(({ pad, status }) => ({ pad, status }))).toEqual([
      { pad: "A1", status: "occupied" },
      { pad: "A2", status: "occupied" },
    ]);
    expect(analysis.occupiedCount).toBe(2);
    expect(analysis.emptyCount).toBe(118);
  });

  it("retains unknown values and reports inconsistent duplicate fields", () => {
    const analysis = parsePadInfo(makeSyntheticPadInfo([[0, {
      flags: 0x1234_5678,
      format: 0x8765_4321,
      pcmOffsetDuplicate: 999,
      wavSizeDuplicate: 1000,
      unknown24: 0x1111_1111,
      unknown28: 0x2222_2222,
    }]]));
    expect(analysis.records[0]).toMatchObject({
      status: "unknown",
      flags: 0x1234_5678,
      format: 0x8765_4321,
      unknown24: 0x1111_1111,
      unknown28: 0x2222_2222,
      duplicateFieldsMatch: false,
    });
    expect(analysis.records[0]?.issues).toHaveLength(3);
    expect(analysis.issues).toHaveLength(3);
  });
});
