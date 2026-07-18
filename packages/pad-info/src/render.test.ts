import { describe, expect, it } from "vitest";
import { PAD_INFO_FILE_SIZE, PAD_INFO_FLAGS, PAD_INFO_FORMAT, parsePadInfo } from "./parse-pad-info.js";
import { renderPadInfo } from "./render.js";

function exampleAnalysis() {
  const bytes = new Uint8Array(PAD_INFO_FILE_SIZE);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < 120; index += 1) {
    const offset = index * 32;
    view.setUint32(offset, 512, false);
    view.setUint32(offset + 4, 512, false);
    view.setUint32(offset + 8, 512, false);
    view.setUint32(offset + 12, 512, false);
    view.setUint32(offset + 16, PAD_INFO_FLAGS.empty, false);
    view.setUint32(offset + 20, PAD_INFO_FORMAT.mono, false);
  }
  view.setUint32(4, 10_512, false);
  view.setUint32(12, 10_512, false);
  view.setUint32(16, PAD_INFO_FLAGS.occupied, false);
  return parsePadInfo(bytes);
}

describe("PAD_INFO analyzer rendering", () => {
  it("renders the expected human-readable occupied and empty pad fields", () => {
    const output = renderPadInfo(exampleAnalysis(), { pad: "A1" });
    expect(output).toContain("A1\n status: occupied\n size: 10512\n pcm bytes: 10000\n channels: mono");
    expect(renderPadInfo(exampleAnalysis(), { pad: "A2" })).toContain("A2\n status: empty\n size: 512");
  });

  it("produces stable machine-readable JSON and filters occupied records", () => {
    const analysis = exampleAnalysis();
    const first = renderPadInfo(analysis, { format: "json", occupiedOnly: true });
    const second = renderPadInfo(analysis, { format: "json", occupiedOnly: true });
    expect(first).toBe(second);
    expect(JSON.parse(first).records).toHaveLength(1);
    expect(JSON.parse(first).records[0]).toMatchObject({ pad: "A1", status: "occupied", flagsHex: "0x7F000001" });
  });

  it("renders Markdown and rejects invalid pad filters", () => {
    expect(renderPadInfo(exampleAnalysis(), { format: "markdown", occupiedOnly: true })).toContain("| A1 | occupied | 10512 | 10000 | mono |");
    expect(() => renderPadInfo(exampleAnalysis(), { pad: "K1" })).toThrow("Unknown pad");
  });
});
