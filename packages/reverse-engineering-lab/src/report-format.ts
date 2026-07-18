export type ReportFormat = "human" | "json" | "markdown";

export function parseReportFormat(value: string | undefined): ReportFormat {
  if (value === undefined || value === "human") return "human";
  if (value === "json" || value === "markdown") return value;
  throw new Error(`Unsupported format: ${value}. Use human, json, or markdown.`);
}

export function hexOffset(offset: number): string {
  return `0x${offset.toString(16).toUpperCase().padStart(8, "0")}`;
}
