import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePadInfo } from "./parse-pad-info.js";

const privateResultsRoot = process.env.SP404_RESULTS_DIR;
const describePrivate = privateResultsRoot ? describe : describe.skip;

function findPadInfo(root: string, directoryFragment: string): string {
  const matches: string[] = [];
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.name === "PAD_INFO.BIN" && candidate.includes(directoryFragment)) matches.push(candidate);
    }
  }
  visit(root);
  if (matches.length !== 1) throw new Error(`Expected one PAD_INFO.BIN matching ${directoryFragment}; found ${matches.length}.`);
  const match = matches[0];
  if (match === undefined) throw new Error(`Missing PAD_INFO.BIN matching ${directoryFragment}.`);
  return match;
}

function readObserved(directoryFragment: string, expectedSha256: string) {
  const file = findPadInfo(privateResultsRoot ?? "", directoryFragment);
  const bytes = readFileSync(file);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(expectedSha256);
  return parsePadInfo(bytes);
}

describePrivate("private Results_clean.zip observations", () => {
  it("validates mono and stereo 5000-frame records", () => {
    expect(readObserved("Test 3 - mono ascending 5000", "9d09d2fc9f3b3df5a7464fe2fb9d7be985e44413e9298b7bba92dce8a38735d8").records[0]).toMatchObject({
      pad: "A1", status: "occupied", wavSize: 10_512, pcmByteLength: 10_000, channelLayout: "mono",
    });
    const stereo5000 = readObserved("Test 4 - stereo channel id", "485f6233879c95c3a5c7767086587cdc660675b783a00f16060a8c4aeb5ff8fc");
    expect(stereo5000.records[0]).toMatchObject({
      pad: "A1", status: "occupied", wavSize: 20_512, pcmByteLength: 20_000, channelLayout: "stereo",
    });
    expect(stereo5000).toMatchObject({ occupiedCount: 1, emptyCount: 11, unknownCount: 108 });
  });

  it("validates mono and stereo 10000-frame records", () => {
    expect(readObserved("Test 11 duration 10000", "e22425a20fb6f61048080440b6095e0ea4113e057557c94da4536b24d34f78cc").records[0]).toMatchObject({
      pad: "A1", wavSize: 20_512, pcmByteLength: 20_000, channelLayout: "mono",
    });
    expect(readObserved("Test 12 duration stereo 10000", "13a3621220d00a5cc3eac679a72e33ee2d3cef94c16773cd68c034eaf1494bba").records[0]).toMatchObject({
      pad: "A1", wavSize: 40_512, pcmByteLength: 40_000, channelLayout: "stereo",
    });
  });

  it("validates the observed empty A1 and occupied A2 mapping", () => {
    const emptyA1 = readObserved("Test 13 - 013-empty-a1", "6c6c0fe8a56026d5eda95e2065ab4e3478397f579853530cbaace86c26d88880");
    expect(emptyA1.records[0]).toMatchObject({ pad: "A1", status: "empty", wavSize: 512 });
    expect(emptyA1.records[1]).toMatchObject({ pad: "A2", status: "occupied", wavSize: 10_512 });

    const a1a2 = readObserved("Test 10 pad a1-a2", "2cbc918123b00d5c08c5df7a0466aac8eba7422ffff56ca6534c70262a762a7d");
    expect(a1a2.records.slice(0, 2).map(({ pad, status }) => ({ pad, status }))).toEqual([
      { pad: "A1", status: "occupied" },
      { pad: "A2", status: "occupied" },
    ]);
  });
});
