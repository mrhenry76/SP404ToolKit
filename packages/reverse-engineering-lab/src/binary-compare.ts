import { sha256 } from "./hash.js";
import { hexOffset, type ReportFormat } from "./report-format.js";

export type BinaryInterpretations = {
  uint16LittleEndian?: number;
  uint32LittleEndian?: number;
  uint32BigEndian?: number;
  printableAscii?: string;
};

export type BinaryRange = {
  relation: "equal" | "different";
  startOffset: number;
  endOffsetExclusive: number;
  startOffsetHex: string;
  endOffsetExclusiveHex: string;
  bytesA: number[];
  bytesB: number[];
  contextBeforeA: number[];
  contextBeforeB: number[];
  contextAfterA: number[];
  contextAfterB: number[];
  interpretationsA?: BinaryInterpretations;
  interpretationsB?: BinaryInterpretations;
};

export type BinaryComparison = {
  fileA: { size: number; sha256: string };
  fileB: { size: number; sha256: string };
  contextBytes: number;
  equal: boolean;
  ranges: BinaryRange[];
  equalRanges: BinaryRange[];
  differentRanges: BinaryRange[];
  interpretationNotice: string;
};

export type CompareOptions = {
  contextBytes?: number | undefined;
  includeInterpretations?: boolean | undefined;
};

function slice(bytes: Uint8Array, start: number, end: number): number[] {
  return Array.from(bytes.subarray(Math.max(0, start), Math.min(bytes.length, end)));
}

function interpret(bytes: Uint8Array, offset: number): BinaryInterpretations {
  const remaining = bytes.length - offset;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output: BinaryInterpretations = {};
  if (remaining >= 2) output.uint16LittleEndian = view.getUint16(offset, true);
  if (remaining >= 4) {
    output.uint32LittleEndian = view.getUint32(offset, true);
    output.uint32BigEndian = view.getUint32(offset, false);
  }
  const asciiBytes = bytes.subarray(offset, Math.min(bytes.length, offset + 16));
  output.printableAscii = Array.from(asciiBytes, (byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".").join("");
  return output;
}

export function compareBinary(inputA: Uint8Array, inputB: Uint8Array, options: CompareOptions = {}): BinaryComparison {
  const contextBytes = options.contextBytes ?? 8;
  if (!Number.isInteger(contextBytes) || contextBytes < 0) {
    throw new RangeError("Context must be a non-negative integer.");
  }
  const maximum = Math.max(inputA.length, inputB.length);
  const boundaries: Array<{ relation: "equal" | "different"; start: number; end: number }> = [];
  let start = 0;
  let current: "equal" | "different" | null = null;

  for (let offset = 0; offset < maximum; offset += 1) {
    const relation = offset < inputA.length && offset < inputB.length && inputA[offset] === inputB[offset]
      ? "equal"
      : "different";
    if (current === null) {
      current = relation;
      start = offset;
    } else if (relation !== current) {
      boundaries.push({ relation: current, start, end: offset });
      current = relation;
      start = offset;
    }
  }
  if (current !== null) boundaries.push({ relation: current, start, end: maximum });

  const ranges = boundaries.map(({ relation, start: rangeStart, end }): BinaryRange => {
    const includeBytes = relation === "different";
    const range: BinaryRange = {
      relation,
      startOffset: rangeStart,
      endOffsetExclusive: end,
      startOffsetHex: hexOffset(rangeStart),
      endOffsetExclusiveHex: hexOffset(end),
      bytesA: includeBytes ? slice(inputA, rangeStart, end) : [],
      bytesB: includeBytes ? slice(inputB, rangeStart, end) : [],
      contextBeforeA: includeBytes ? slice(inputA, rangeStart - contextBytes, rangeStart) : [],
      contextBeforeB: includeBytes ? slice(inputB, rangeStart - contextBytes, rangeStart) : [],
      contextAfterA: includeBytes ? slice(inputA, end, end + contextBytes) : [],
      contextAfterB: includeBytes ? slice(inputB, end, end + contextBytes) : [],
    };
    if (options.includeInterpretations && relation === "different") {
      range.interpretationsA = interpret(inputA, rangeStart);
      range.interpretationsB = interpret(inputB, rangeStart);
    }
    return range;
  });

  return {
    fileA: { size: inputA.length, sha256: sha256(inputA) },
    fileB: { size: inputB.length, sha256: sha256(inputB) },
    contextBytes,
    equal: inputA.length === inputB.length && ranges.every((range) => range.relation === "equal"),
    ranges,
    equalRanges: ranges.filter((range) => range.relation === "equal"),
    differentRanges: ranges.filter((range) => range.relation === "different"),
    interpretationNotice: "Integer and ASCII views are diagnostics only; they do not establish field meaning.",
  };
}

function byteList(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(" ") || "—";
}

export function renderBinaryComparison(report: BinaryComparison, format: ReportFormat): string {
  if (format === "json") {
    const { ranges: _ranges, ...summary } = report;
    return `${JSON.stringify(summary, null, 2)}\n`;
  }
  const rangeLines = report.ranges.map((range) => {
    const label = `${range.relation.toUpperCase()} ${range.startOffset}..${range.endOffsetExclusive - 1} (${range.startOffsetHex}..${hexOffset(Math.max(range.startOffset, range.endOffsetExclusive - 1))})`;
    return { range, label };
  });
  if (format === "markdown") {
    return [
      "# Binary comparison",
      "",
      `- File A: ${report.fileA.size} bytes, \`${report.fileA.sha256}\``,
      `- File B: ${report.fileB.size} bytes, \`${report.fileB.sha256}\``,
      `- Equal: ${report.equal}`,
      `- Context: ${report.contextBytes} bytes`,
      "",
      `> ${report.interpretationNotice}`,
      "",
      "| Relation | Decimal range | Hex range | A bytes | B bytes |",
      "|---|---:|---:|---|---|",
      ...rangeLines.map(({ range }) => `| ${range.relation} | ${range.startOffset}–${range.endOffsetExclusive - 1} | ${range.startOffsetHex}–${hexOffset(Math.max(range.startOffset, range.endOffsetExclusive - 1))} | \`${byteList(range.bytesA)}\` | \`${byteList(range.bytesB)}\` |`),
      "",
      ...rangeLines.filter(({ range }) => range.interpretationsA).flatMap(({ range, label }) => [
        `## ${label}`,
        "",
        `- Context before A: \`${byteList(range.contextBeforeA)}\``,
        `- Context before B: \`${byteList(range.contextBeforeB)}\``,
        `- Context after A: \`${byteList(range.contextAfterA)}\``,
        `- Context after B: \`${byteList(range.contextAfterB)}\``,
        "",
        "```json",
        JSON.stringify({ A: range.interpretationsA, B: range.interpretationsB }, null, 2),
        "```",
        "",
      ]),
      ...rangeLines.filter(({ range }) => range.relation === "different" && !range.interpretationsA).flatMap(({ range, label }) => [
        `## ${label}`,
        "",
        `- Context before A: \`${byteList(range.contextBeforeA)}\``,
        `- Context before B: \`${byteList(range.contextBeforeB)}\``,
        `- Context after A: \`${byteList(range.contextAfterA)}\``,
        `- Context after B: \`${byteList(range.contextAfterB)}\``,
        "",
      ]),
    ].join("\n");
  }
  return [
    "Binary comparison",
    `File A: ${report.fileA.size} bytes | SHA-256 ${report.fileA.sha256}`,
    `File B: ${report.fileB.size} bytes | SHA-256 ${report.fileB.sha256}`,
    `Equal: ${report.equal}`,
    `Context: ${report.contextBytes} byte(s)`,
    report.interpretationNotice,
    ...rangeLines.flatMap(({ range, label }) => [
      label,
      `  A: ${byteList(range.bytesA)}`,
      `  B: ${byteList(range.bytesB)}`,
      `  before A/B: ${byteList(range.contextBeforeA)} / ${byteList(range.contextBeforeB)}`,
      `  after A/B: ${byteList(range.contextAfterA)} / ${byteList(range.contextAfterB)}`,
      ...(range.interpretationsA ? [`  diagnostic A: ${JSON.stringify(range.interpretationsA)}`, `  diagnostic B: ${JSON.stringify(range.interpretationsB)}`] : []),
    ]),
    "",
  ].join("\n");
}
