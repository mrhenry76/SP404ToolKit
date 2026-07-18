import { describe, expect, it } from "vitest";
import {
  ALL_PAD_IDS,
  assignPadsFromFileNames,
  isPadId,
  parsePadFromFileName,
} from "./pads.js";

describe("pad model", () => {
  it("contains A1 through J12 in bank order", () => {
    expect(ALL_PAD_IDS).toHaveLength(120);
    expect(ALL_PAD_IDS[0]).toBe("A1");
    expect(ALL_PAD_IDS[11]).toBe("A12");
    expect(ALL_PAD_IDS[119]).toBe("J12");
  });

  it("validates pad boundaries", () => {
    expect(isPadId("A1")).toBe(true);
    expect(isPadId("j12")).toBe(true);
    expect(isPadId("A0")).toBe(false);
    expect(isPadId("J13")).toBe(false);
    expect(isPadId("K1")).toBe(false);
  });
});

describe("filename mapping", () => {
  it.each([
    ["[A1] Kick.wav", "A1"],
    ["A1_Kick.wav", "A1"],
    ["A1-Kick.wav", "A1"],
    ["PAD_A1_Kick.wav", "A1"],
    ["[c10] Snare.wav", "C10"],
  ])("parses %s", (name, pad) => {
    expect(parsePadFromFileName(name)).toBe(pad);
  });

  it("does not infer a pad from arbitrary text", () => {
    expect(parsePadFromFileName("Take_A1_Kick.wav")).toBeNull();
    expect(parsePadFromFileName("A13_Kick.wav")).toBeNull();
  });

  it("keeps explicit unique pads and fills remaining slots", () => {
    expect(assignPadsFromFileNames(["[A2] snare.wav", "kick.wav", "A2-clap.wav"])).toEqual([
      { fileName: "[A2] snare.wav", pad: "A2" },
      { fileName: "kick.wav", pad: "A1" },
      { fileName: "A2-clap.wav", pad: "A3" },
    ]);
  });
});
