import type { PadInfoAnalysis, PadInfoRecord } from "./types.js";

export type PadInfoOutputFormat = "human" | "json" | "markdown";

export type PadInfoRenderOptions = {
  format?: PadInfoOutputFormat | undefined;
  occupiedOnly?: boolean | undefined;
  pad?: string | undefined;
};

export function parsePadInfoOutputFormat(value: string | undefined): PadInfoOutputFormat {
  if (value === undefined || value === "human") return "human";
  if (value === "json" || value === "markdown") return value;
  throw new Error(`Unsupported format: ${value}. Use human, json, or markdown.`);
}

function hex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

function selectRecords(analysis: PadInfoAnalysis, options: PadInfoRenderOptions): PadInfoRecord[] {
  const requestedPad = options.pad?.trim().toUpperCase();
  if (requestedPad !== undefined && !analysis.records.some((record) => record.pad === requestedPad)) {
    throw new Error(`Unknown pad: ${options.pad}. Use A1 through J12.`);
  }
  return analysis.records.filter((record) =>
    (requestedPad === undefined || record.pad === requestedPad)
    && (!options.occupiedOnly || record.status === "occupied"),
  );
}

function recordJson(record: PadInfoRecord): Record<string, unknown> {
  return {
    index: record.index,
    pad: record.pad,
    recordOffset: record.recordOffset,
    pcmOffset: record.pcmOffset,
    wavSize: record.wavSize,
    pcmOffsetDuplicate: record.pcmOffsetDuplicate,
    wavSizeDuplicate: record.wavSizeDuplicate,
    flags: record.flags,
    flagsHex: hex(record.flags),
    format: record.format,
    formatHex: hex(record.format),
    unknown24: record.unknown24,
    unknown28: record.unknown28,
    status: record.status,
    channelLayout: record.channelLayout,
    channels: record.channels,
    pcmByteLength: record.pcmByteLength,
    duplicateFieldsMatch: record.duplicateFieldsMatch,
    issues: record.issues,
  };
}

export function renderPadInfo(analysis: PadInfoAnalysis, options: PadInfoRenderOptions = {}): string {
  const format = options.format ?? "human";
  const records = selectRecords(analysis, options);
  if (format === "json") {
    return `${JSON.stringify({
      fileSize: analysis.fileSize,
      recordSize: analysis.recordSize,
      recordCount: analysis.recordCount,
      occupiedCount: analysis.occupiedCount,
      emptyCount: analysis.emptyCount,
      unknownCount: analysis.unknownCount,
      issues: analysis.issues,
      records: records.map(recordJson),
    }, null, 2)}\n`;
  }

  if (format === "markdown") {
    return [
      "# PAD_INFO.BIN analysis",
      "",
      `- File size: ${analysis.fileSize}`,
      `- Records: ${analysis.recordCount} × ${analysis.recordSize} bytes`,
      `- Occupied: ${analysis.occupiedCount}`,
      `- Empty: ${analysis.emptyCount}`,
      `- Unknown: ${analysis.unknownCount}`,
      "",
      "| Pad | Status | Size | PCM bytes | Channels | Flags | Format | Issues |",
      "|---|---|---:|---:|---|---|---|---|",
      ...records.map((record) => `| ${record.pad} | ${record.status} | ${record.wavSize} | ${record.pcmByteLength ?? ""} | ${record.channelLayout ?? ""} | ${hex(record.flags)} | ${hex(record.format)} | ${record.issues.join(" ")} |`),
      "",
    ].join("\n");
  }

  return [
    "PAD_INFO.BIN analysis",
    `file size: ${analysis.fileSize}`,
    `records: ${analysis.recordCount} × ${analysis.recordSize} bytes`,
    `summary: ${analysis.occupiedCount} occupied, ${analysis.emptyCount} empty, ${analysis.unknownCount} unknown`,
    "",
    ...records.flatMap((record) => [
      record.pad,
      ` status: ${record.status}`,
      ` size: ${record.wavSize}`,
      ...(record.pcmByteLength !== null ? [` pcm bytes: ${record.pcmByteLength}`] : []),
      ...(record.channelLayout !== null ? [` channels: ${record.channelLayout}`] : []),
      ` pcm offset: ${record.pcmOffset}`,
      ` flags: ${hex(record.flags)}`,
      ` format: ${hex(record.format)}`,
      ...(record.issues.length > 0 ? [` issues: ${record.issues.join(" ")}`] : []),
      "",
    ]),
  ].join("\n");
}
