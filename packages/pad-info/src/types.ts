import type { PadId } from "@sp404-toolkit/core";

export type PadInfoStatus = "occupied" | "empty" | "unknown";
export type PadInfoChannelLayout = "mono" | "stereo" | "unknown";

export type PadInfoRecord = {
  index: number;
  pad: PadId;
  recordOffset: number;
  pcmOffset: number;
  wavSize: number;
  pcmOffsetDuplicate: number;
  wavSizeDuplicate: number;
  flags: number;
  format: number;
  unknown24: number;
  unknown28: number;
  status: PadInfoStatus;
  channelLayout: PadInfoChannelLayout | null;
  channels: 1 | 2 | null;
  pcmByteLength: number | null;
  duplicateFieldsMatch: boolean;
  issues: string[];
};

export type PadInfoAnalysis = {
  fileSize: number;
  recordSize: number;
  recordCount: number;
  occupiedCount: number;
  emptyCount: number;
  unknownCount: number;
  records: PadInfoRecord[];
  issues: string[];
};
