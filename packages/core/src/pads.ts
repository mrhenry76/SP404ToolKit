export const PAD_BANKS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
export const PADS_PER_BANK = 12 as const;
export const MAX_PADS = PAD_BANKS.length * PADS_PER_BANK;

export type PadBank = (typeof PAD_BANKS)[number];
export type PadNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type PadId = `${PadBank}${PadNumber}`;

export const ALL_PAD_IDS: readonly PadId[] = PAD_BANKS.flatMap((bank) =>
  Array.from({ length: PADS_PER_BANK }, (_, index) => `${bank}${index + 1}` as PadId),
);

const PAD_SET = new Set<string>(ALL_PAD_IDS);

export function isPadId(value: string): value is PadId {
  return PAD_SET.has(value.toUpperCase());
}

export function normalizePadId(value: string): PadId | null {
  const normalized = value.trim().toUpperCase();
  return isPadId(normalized) ? normalized : null;
}

const PAD_FILENAME_PATTERNS = [
  /^\[([A-J](?:1[0-2]|[1-9]))\](?:[ _-]+|$)/i,
  /^PAD[_ -]([A-J](?:1[0-2]|[1-9]))(?:[ _-]+|\.|$)/i,
  /^([A-J](?:1[0-2]|[1-9]))(?:[_-]+|\.|$)/i,
] as const;

/** Recognizes only the documented, anchored filename conventions. */
export function parsePadFromFileName(fileName: string): PadId | null {
  for (const pattern of PAD_FILENAME_PATTERNS) {
    const match = pattern.exec(fileName.trim());
    const candidate = match?.[1];
    if (candidate) return normalizePadId(candidate);
  }
  return null;
}

export function firstFreePad(occupied: Iterable<PadId>): PadId | null {
  const used = new Set(occupied);
  return ALL_PAD_IDS.find((pad) => !used.has(pad)) ?? null;
}

export function assignPadsFromFileNames(fileNames: readonly string[]): Array<{
  fileName: string;
  pad: PadId | null;
}> {
  const used = new Set<PadId>();
  const assignments = fileNames.map((fileName) => {
    const requested = parsePadFromFileName(fileName);
    const pad = requested && !used.has(requested) ? requested : null;
    if (pad) used.add(pad);
    return { fileName, pad };
  });

  for (const assignment of assignments) {
    if (assignment.pad) continue;
    assignment.pad = firstFreePad(used);
    if (assignment.pad) used.add(assignment.pad);
  }
  return assignments;
}
