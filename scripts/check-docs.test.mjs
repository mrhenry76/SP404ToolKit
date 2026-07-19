import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  findUnclosedCodeFence,
  validateLocalLinks,
  validateWindowsPath,
} from "./check-docs.mjs";

test("rejects an unclosed Markdown code fence", () => {
  assert.equal(
    findUnclosedCodeFence("# Broken\n\n```text\nunclosed\n"),
    "Unclosed Markdown code fence opened at line 3.",
  );
  assert.equal(
    findUnclosedCodeFence("> ```text\n> unclosed\n"),
    "Unclosed Markdown code fence opened at line 1.",
  );
  assert.equal(findUnclosedCodeFence("```text\nclosed\n```\n"), null);
});

test("rejects a relative link to a missing file", () => {
  const root = mkdtempSync(path.join(tmpdir(), "sp404-docs-check-"));
  try {
    const markdownPath = path.join(root, "README.md");
    writeFileSync(markdownPath, "[Missing](docs/missing.md)\n");
    assert.deepEqual(validateLocalLinks(
      "[Missing](docs/missing.md)\n",
      markdownPath,
      root,
    ), ["Local link target does not exist with exact casing: 'docs/missing.md'."]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a Windows-incompatible colon in a path", () => {
  assert.deepEqual(validateWindowsPath("docs:roadmap.md"), [
    "Windows-incompatible path contains a reserved character: docs:roadmap.md",
  ]);
});
