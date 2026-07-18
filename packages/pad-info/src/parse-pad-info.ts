import { ALL_PAD_IDS } from "@sp404-toolkit/core";
import type { PadInfoAnalysis, PadInfoChannelLayout, PadInfoRecord, PadInfoStatus } from "./types.js";

export const PAD_INFO_RECORD_SIZE = 32 as const;
export const PAD_INFO_RECORD_COUNT = 120 as const;
export const PAD_INFO_FILE_SIZE = PAD_INFO_RECORD_SIZE * PAD_INFO_RECORD_COUNT;

export const PAD_INFO_FLAGS = {
  empty: 0x7f00_0000,
  occupied: 0x7f00_0001,
} as const;

export const PAD_INFO_FORMAT = {
  mono: 0x0001_0100,
  stereo: 0x0001_0200,
} as const;

export const PAD_INFO_EMPTY_SIZE = 512 as const;

function decodeStatus(flags: number): PadInfoStatus {
  if (flags === PAD_INFO_FLAGS.occupied) return "occupied";
  if (flags === PAD_INFO_FLAGS.empty) return "empty";
  return "unknown";
}

function decodeChannelLayout(format: number): { layout: PadInfoChannelLayout; channels: 1 | 2 | null } {
  if (format === PAD_INFO_FORMAT.mono) return { layout: "mono", channels: 1 };
  if (format === PAD_INFO_FORMAT.stereo) return { layout: "stereo", channels: 2 };
  return { layout: "unknown", channels: null };
}

function parseRecord(view: DataView, index: number): PadInfoRecord {
  const recordOffset = index * PAD_INFO_RECORD_SIZE;
  const pcmOffset = view.getUint32(recordOffset, false);
  const wavSize = view.getUint32(recordOffset + 4, false);
  const pcmOffsetDuplicate = view.getUint32(recordOffset + 8, false);
  const wavSizeDuplicate = view.getUint32(recordOffset + 12, false);
  const flags = view.getUint32(recordOffset + 16, false);
  const format = view.getUint32(recordOffset + 20, false);
  const unknown24 = view.getUint32(recordOffset + 24, false);
  const unknown28 = view.getUint32(recordOffset + 28, false);
  const status = decodeStatus(flags);
  const decodedFormat = decodeChannelLayout(format);
  const issues: string[] = [];

  if (pcmOffset !== pcmOffsetDuplicate) issues.push("PCM offset duplicate does not match.");
  if (wavSize !== wavSizeDuplicate) issues.push("WAV size duplicate does not match.");
  if (status === "unknown") issues.push(`Unknown flags value 0x${flags.toString(16).padStart(8, "0")}.`);
  if (status === "occupied" && decodedFormat.layout === "unknown") {
    issues.push(`Unknown occupied-pad format 0x${format.toString(16).padStart(8, "0")}.`);
  }
  if (status === "occupied" && wavSize < pcmOffset) issues.push("Occupied-pad size is smaller than its PCM offset.");
  if (status === "empty" && wavSize !== PAD_INFO_EMPTY_SIZE) {
    issues.push(`Empty-pad size is ${wavSize}; expected ${PAD_INFO_EMPTY_SIZE}.`);
  }

  const pad = ALL_PAD_IDS[index];
  if (pad === undefined) throw new RangeError(`PAD_INFO record index ${index} has no pad mapping.`);
  const duplicateFieldsMatch = pcmOffset === pcmOffsetDuplicate && wavSize === wavSizeDuplicate;
  const pcmByteLength = status === "empty" ? 0 : status === "occupied" && wavSize >= pcmOffset ? wavSize - pcmOffset : null;

  return {
    index,
    pad,
    recordOffset,
    pcmOffset,
    wavSize,
    pcmOffsetDuplicate,
    wavSizeDuplicate,
    flags,
    format,
    unknown24,
    unknown28,
    status,
    channelLayout: status === "occupied" ? decodedFormat.layout : null,
    channels: status === "occupied" ? decodedFormat.channels : null,
    pcmByteLength,
    duplicateFieldsMatch,
    issues,
  };
}

/** Parses PAD_INFO.BIN without mutating or normalizing any source bytes. */
export function parsePadInfo(input: ArrayBuffer | Uint8Array): PadInfoAnalysis {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength !== PAD_INFO_FILE_SIZE) {
    throw new RangeError(`PAD_INFO.BIN must be exactly ${PAD_INFO_FILE_SIZE} bytes; received ${bytes.byteLength}.`);
  }
  if (ALL_PAD_IDS.length !== PAD_INFO_RECORD_COUNT) {
    throw new RangeError(`Core pad map must contain exactly ${PAD_INFO_RECORD_COUNT} pads.`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const records = Array.from({ length: PAD_INFO_RECORD_COUNT }, (_, index) => parseRecord(view, index));
  const issues = records.flatMap((record) => record.issues.map((issue) => `${record.pad}: ${issue}`));

  return {
    fileSize: bytes.byteLength,
    recordSize: PAD_INFO_RECORD_SIZE,
    recordCount: records.length,
    occupiedCount: records.filter((record) => record.status === "occupied").length,
    emptyCount: records.filter((record) => record.status === "empty").length,
    unknownCount: records.filter((record) => record.status === "unknown").length,
    records,
    issues,
  };
}
