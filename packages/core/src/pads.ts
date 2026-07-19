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
  return PAD_SET.has(value);
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

export type AutomaticPadAssignment =
  | {
      status: "assigned";
      code: "AUTO_PAD_ASSIGNED";
      fileName: string;
      requestedPad: PadId;
      pad: PadId;
    }
  | {
      status: "fallback";
      code: "AUTO_PAD_FALLBACK";
      fileName: string;
      requestedPad: PadId | null;
      pad: PadId;
      reason: "PAD_OCCUPIED" | "NO_FILENAME_MATCH";
    }
  | {
      status: "unassigned";
      code: "PAD_EXHAUSTED";
      fileName: string;
      requestedPad: PadId | null;
      pad: null;
    };

/** Plans deterministic assignments without mutating the supplied occupied pads. */
export function planAutomaticPadAssignments(
  fileNames: readonly string[],
  occupied: Iterable<PadId> = [],
): AutomaticPadAssignment[] {
  const used = new Set(occupied);
  const planned = fileNames.map((fileName): AutomaticPadAssignment | {
    fileName: string;
    requestedPad: PadId | null;
    status: "pending";
  } => {
    const requestedPad = parsePadFromFileName(fileName);
    if (requestedPad && !used.has(requestedPad)) {
      used.add(requestedPad);
      return { status: "assigned", code: "AUTO_PAD_ASSIGNED", fileName, requestedPad, pad: requestedPad };
    }
    return { status: "pending", fileName, requestedPad };
  });

  return planned.map((assignment): AutomaticPadAssignment => {
    if (assignment.status !== "pending") return assignment;
    const pad = firstFreePad(used);
    if (!pad) {
      return {
        status: "unassigned",
        code: "PAD_EXHAUSTED",
        fileName: assignment.fileName,
        requestedPad: assignment.requestedPad,
        pad: null,
      };
    }
    used.add(pad);
    return {
      status: "fallback",
      code: "AUTO_PAD_FALLBACK",
      fileName: assignment.fileName,
      requestedPad: assignment.requestedPad,
      pad,
      reason: assignment.requestedPad ? "PAD_OCCUPIED" : "NO_FILENAME_MATCH",
    };
  });
}

export function assignPadsFromFileNames(fileNames: readonly string[]): Array<{
  fileName: string;
  pad: PadId | null;
}> {
  return planAutomaticPadAssignments(fileNames).map(({ fileName, pad }) => ({ fileName, pad }));
}
