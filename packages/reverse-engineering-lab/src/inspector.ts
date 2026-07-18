import { getPcmBytes, parseWav, type WavFormat } from "@sp404-toolkit/wav";
import { sha256 } from "./hash.js";
import { hexOffset, type ReportFormat } from "./report-format.js";

export type InspectedChunk = {
  id: string;
  headerOffset: number;
  dataOffset: number;
  declaredSize: number;
  paddingBytes: number;
  endOffsetExclusive: number;
  payloadSha256?: string;
  hexDump?: string;
  classification: "fmt" | "data" | "unknown";
};

export type WavInspection = {
  physicalFileSize: number;
  riffSize: number;
  riffDeclaredFileSize: number;
  trailingBytes: number;
  chunks: InspectedChunk[];
  format: WavFormat;
  pcm: {
    payloadOffset: number;
    size: number;
    frames: number;
    sha256: string;
  };
};

export type InspectOptions = {
  includeHexDump?: boolean | undefined;
  hexDumpLimit?: number | undefined;
};

function toHex(bytes: Uint8Array, limit: number): string {
  const selected = bytes.subarray(0, limit);
  const result = Array.from(selected, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
  return selected.length < bytes.length ? `${result} …` : result;
}

export function inspectWav(input: ArrayBuffer | Uint8Array, options: InspectOptions = {}): WavInspection {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const wav = parseWav(bytes);
  const limit = options.hexDumpLimit ?? 256;
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError("Hex dump limit must be a non-negative integer.");

  const chunks = wav.chunks.map((chunk): InspectedChunk => {
    const classification = chunk.id === "fmt " ? "fmt" : chunk.id === "data" ? "data" : "unknown";
    const payload = bytes.subarray(chunk.dataOffset, chunk.dataOffset + chunk.size);
    const inspected: InspectedChunk = {
      id: chunk.id,
      headerOffset: chunk.headerOffset,
      dataOffset: chunk.dataOffset,
      declaredSize: chunk.size,
      paddingBytes: chunk.size % 2,
      endOffsetExclusive: chunk.dataOffset + chunk.size,
      classification,
    };
    if (classification === "unknown") {
      inspected.payloadSha256 = sha256(payload);
      if (options.includeHexDump) inspected.hexDump = toHex(payload, limit);
    }
    return inspected;
  });
  const pcmBytes = getPcmBytes(bytes, wav);
  return {
    physicalFileSize: bytes.byteLength,
    riffSize: wav.riffSize,
    riffDeclaredFileSize: wav.fileSize,
    trailingBytes: bytes.byteLength - wav.fileSize,
    chunks,
    format: wav.format,
    pcm: {
      payloadOffset: wav.data.dataOffset,
      size: wav.data.size,
      frames: wav.data.size / wav.format.blockAlign,
      sha256: sha256(pcmBytes),
    },
  };
}

function renderChunkHuman(chunk: InspectedChunk): string {
  const details = [
    `${chunk.id} @ ${chunk.headerOffset} (${hexOffset(chunk.headerOffset)})`,
    `payload=${chunk.dataOffset}..${chunk.endOffsetExclusive - 1}`,
    `size=${chunk.declaredSize}`,
    `padding=${chunk.paddingBytes}`,
    `class=${chunk.classification}`,
  ];
  if (chunk.payloadSha256) details.push(`sha256=${chunk.payloadSha256}`);
  if (chunk.hexDump !== undefined) details.push(`hex=${chunk.hexDump}`);
  return `- ${details.join(" | ")}`;
}

export function renderWavInspection(report: WavInspection, format: ReportFormat): string {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  if (format === "markdown") {
    const rows = report.chunks.map((chunk) =>
      `| \`${chunk.id}\` | ${chunk.headerOffset} | ${hexOffset(chunk.headerOffset)} | ${chunk.dataOffset} | ${chunk.declaredSize} | ${chunk.paddingBytes} | ${chunk.classification} | ${chunk.payloadSha256 ?? ""} |`,
    );
    return [
      "# WAV structure report",
      "",
      `- Physical file size: ${report.physicalFileSize}`,
      `- RIFF size: ${report.riffSize}`,
      `- RIFF-declared file size: ${report.riffDeclaredFileSize}`,
      `- PCM payload: offset ${report.pcm.payloadOffset}, ${report.pcm.size} bytes, ${report.pcm.frames} frames`,
      `- PCM SHA-256: \`${report.pcm.sha256}\``,
      "",
      "## Format",
      "",
      "```json",
      JSON.stringify(report.format, null, 2),
      "```",
      "",
      "## Chunks",
      "",
      "| ID | Offset | Hex offset | Payload offset | Size | Padding | Classification | Payload SHA-256 |",
      "|---|---:|---:|---:|---:|---:|---|---|",
      ...rows,
      "",
      ...report.chunks.filter((chunk) => chunk.hexDump !== undefined).flatMap((chunk) => [
        `### ${chunk.id} hex dump`, "", "```text", chunk.hexDump ?? "", "```", "",
      ]),
    ].join("\n");
  }
  return [
    "WAV structure report",
    `Physical file size: ${report.physicalFileSize}`,
    `RIFF size: ${report.riffSize} (declared file size ${report.riffDeclaredFileSize})`,
    `Trailing bytes: ${report.trailingBytes}`,
    `Format: PCM tag ${report.format.audioFormat}, ${report.format.channels} channel(s), ${report.format.sampleRate} Hz, ${report.format.bitDepth}-bit, block align ${report.format.blockAlign}`,
    `PCM: offset ${report.pcm.payloadOffset}, ${report.pcm.size} bytes, ${report.pcm.frames} frames`,
    `PCM SHA-256: ${report.pcm.sha256}`,
    "Chunks:",
    ...report.chunks.map(renderChunkHuman),
    "",
  ].join("\n");
}
