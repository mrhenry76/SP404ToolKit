import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, linkify: false });
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const WINDOWS_INVALID_CHARACTER = /[<>:"\\|?*\u0000-\u001f]/u;

function trackedFiles(root) {
  return execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

export function validateWindowsPath(filePath) {
  const issues = [];
  for (const segment of filePath.split("/")) {
    if (WINDOWS_INVALID_CHARACTER.test(segment)) {
      issues.push(`Windows-incompatible path contains a reserved character: ${filePath}`);
    }
    if (segment.endsWith(".") || segment.endsWith(" ")) {
      issues.push(`Windows-incompatible path has a trailing dot or space: ${filePath}`);
    }
    if (WINDOWS_RESERVED_NAME.test(segment)) {
      issues.push(`Windows-incompatible reserved name: ${filePath}`);
    }
  }
  return issues;
}

export function findUnclosedCodeFence(source) {
  for (const token of markdown.parse(source, {})) {
    if (token.type !== "fence" || !token.map) continue;
    const sourceLineCount = token.map[1] - token.map[0];
    const contentLineCount = token.content.split("\n").length - 1;
    if (sourceLineCount === contentLineCount + 1) {
      return `Unclosed Markdown code fence opened at line ${token.map[0] + 1}.`;
    }
  }
  return null;
}

function markdownLinks(source) {
  const links = [];
  const visit = (tokens) => {
    for (const token of tokens) {
      if (token.type === "link_open") links.push(token.attrGet("href"));
      if (token.type === "image") links.push(token.attrGet("src"));
      if (token.children) visit(token.children);
    }
  };
  visit(markdown.parse(source, {}));
  return links.filter(Boolean);
}

function isExternalLink(link) {
  if (link.startsWith("//")) return true;
  const colon = link.indexOf(":");
  if (colon <= 0) return false;
  const scheme = link.slice(0, colon);
  return /^[A-Za-z][A-Za-z0-9+.-]*$/u.test(scheme);
}

function exactPathExists(root, absolutePath) {
  const relative = path.relative(root, absolutePath);
  if (relative === "") return true;
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false;

  let current = root;
  for (const segment of relative.split(path.sep)) {
    if (!existsSync(current) || !statSync(current).isDirectory()) return false;
    if (!readdirSync(current).includes(segment)) return false;
    current = path.join(current, segment);
  }
  return existsSync(current);
}

export function validateLocalLinks(source, markdownPath, root) {
  const issues = [];
  for (const link of markdownLinks(source)) {
    if (link.startsWith("#") || isExternalLink(link)) continue;

    const withoutFragment = link.split("#", 1)[0].split("?", 1)[0];
    if (!withoutFragment) continue;

    let decoded;
    try {
      decoded = decodeURIComponent(withoutFragment);
    } catch {
      issues.push(`Invalid percent-encoding in local link '${link}'.`);
      continue;
    }

    const target = decoded.startsWith("/")
      ? path.resolve(root, decoded.slice(1))
      : path.resolve(path.dirname(markdownPath), decoded);
    if (!exactPathExists(root, target)) {
      issues.push(`Local link target does not exist with exact casing: '${link}'.`);
    }
  }
  return issues;
}

export function validateMarkdownFile(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const bytes = readFileSync(absolutePath);
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return ["Markdown file is not valid UTF-8 text."];
  }

  const issues = [];
  if (source.trimStart().toLowerCase().startsWith("{\\rtf")) {
    issues.push("Markdown file contains RTF content.");
  }
  const fenceIssue = findUnclosedCodeFence(source);
  if (fenceIssue) issues.push(fenceIssue);
  issues.push(...validateLocalLinks(source, absolutePath, root));
  return issues;
}

export function checkRepository(root = process.cwd()) {
  const issues = [];
  const files = trackedFiles(root);

  for (const file of files) {
    for (const issue of validateWindowsPath(file)) issues.push(`${file}: ${issue}`);
    if (path.extname(file).toLowerCase() !== ".md") continue;
    for (const issue of validateMarkdownFile(root, file)) issues.push(`${file}: ${issue}`);
  }
  return issues;
}

function main() {
  const issues = checkRepository();
  if (issues.length > 0) {
    for (const issue of issues) console.error(issue);
    process.exitCode = 1;
    return;
  }
  console.log("Documentation links, code fences, file contents, and Windows paths are valid.");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) main();
