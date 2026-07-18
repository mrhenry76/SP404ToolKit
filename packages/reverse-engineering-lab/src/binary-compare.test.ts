import { describe, expect, it } from "vitest";
import { compareBinary, renderBinaryComparison } from "./binary-compare.js";

describe("binary comparison", () => {
  it("finds contiguous equal and different ranges including a longer tail", () => {
    const report = compareBinary(
      new Uint8Array([1, 2, 3, 4, 5, 6]),
      new Uint8Array([1, 2, 9, 8, 5, 6, 7]),
      { contextBytes: 1 },
    );
    expect(report.equal).toBe(false);
    expect(report.ranges.map(({ relation, startOffset, endOffsetExclusive }) => [relation, startOffset, endOffsetExclusive])).toEqual([
      ["equal", 0, 2],
      ["different", 2, 4],
      ["equal", 4, 6],
      ["different", 6, 7],
    ]);
    expect(report.differentRanges[0]).toMatchObject({
      bytesA: [3, 4],
      bytesB: [9, 8],
      contextBeforeA: [2],
      contextAfterA: [5],
      startOffsetHex: "0x00000002",
    });
  });

  it("adds explicitly diagnostic endian and ASCII views", () => {
    const report = compareBinary(
      new Uint8Array([1, 2, 3, 65, 66]),
      new Uint8Array([5, 6, 7, 67, 68]),
      { includeInterpretations: true },
    );
    expect(report.differentRanges[0]?.interpretationsA).toMatchObject({
      uint16LittleEndian: 513,
      uint32LittleEndian: 1_090_716_161,
      uint32BigEndian: 16_909_121,
      printableAscii: "...AB",
    });
    expect(report.interpretationNotice).toContain("do not establish field meaning");
  });

  it("recognizes identical files and renders every format", () => {
    const report = compareBinary(new Uint8Array([1, 2]), new Uint8Array([1, 2]));
    expect(report.equal).toBe(true);
    expect(report.differentRanges).toEqual([]);
    expect(renderBinaryComparison(report, "human")).toContain("Equal: true");
    expect(JSON.parse(renderBinaryComparison(report, "json"))).toMatchObject({
      equal: true,
      equalRanges: report.equalRanges,
      differentRanges: [],
    });
    expect(renderBinaryComparison(report, "markdown")).toContain("# Binary comparison");
  });
});
