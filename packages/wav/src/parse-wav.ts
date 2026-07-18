export class WavParseError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WavParseError";
    this.code = code;
  }
}

export type WavChunk = {
  id: string;
  headerOffset: number;
  dataOffset: number;
  size: number;
};

export type WavFormat = {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitDepth: number;
  extraSize: number;
};

export type ParsedWav = {
  riffSize: number;
  fileSize: number;
  format: WavFormat;
  data: WavChunk;
  chunks: readonly WavChunk[];
  durationSeconds: number;
  isPcm: boolean;
};

const decoder = new TextDecoder("ascii");

function fourCC(bytes: Uint8Array, offset: number): string {
  return decoder.decode(bytes.subarray(offset, offset + 4));
}

function fail(code: string, message: string): never {
  throw new WavParseError(code, message);
}

/** Parses RIFF/WAVE structure without decoding or changing PCM bytes. */
export function parseWav(input: ArrayBuffer | Uint8Array): ParsedWav {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < 12) fail("WAV_TOO_SHORT", "A RIFF/WAVE file needs at least 12 bytes.");

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (fourCC(bytes, 0) !== "RIFF") fail("INVALID_RIFF", "Expected a RIFF container.");
  if (fourCC(bytes, 8) !== "WAVE") fail("INVALID_WAVE", "Expected WAVE as the RIFF form type.");

  const riffSize = view.getUint32(4, true);
  const declaredEnd = riffSize + 8;
  if (declaredEnd < 12) fail("INVALID_RIFF_SIZE", "The declared RIFF size is invalid.");
  if (declaredEnd > bytes.byteLength) {
    fail("TRUNCATED_RIFF", `RIFF declares ${declaredEnd} bytes but only ${bytes.byteLength} are available.`);
  }

  const chunks: WavChunk[] = [];
  let cursor = 12;
  while (cursor < declaredEnd) {
    if (cursor + 8 > declaredEnd) fail("TRUNCATED_CHUNK_HEADER", `Chunk header at offset ${cursor} is truncated.`);
    const id = fourCC(bytes, cursor);
    const size = view.getUint32(cursor + 4, true);
    const dataOffset = cursor + 8;
    const dataEnd = dataOffset + size;
    if (dataEnd > declaredEnd) fail("TRUNCATED_CHUNK_DATA", `Chunk ${id} at offset ${cursor} is truncated.`);
    chunks.push({ id, headerOffset: cursor, dataOffset, size });
    cursor = dataEnd + (size % 2);
    if (cursor > declaredEnd) fail("MISSING_CHUNK_PADDING", `Odd-sized chunk ${id} has no padding byte.`);
  }

  const formatChunk = chunks.find((chunk) => chunk.id === "fmt ");
  if (!formatChunk) fail("MISSING_FMT", "The WAV has no fmt chunk.");
  if (formatChunk.size < 16) fail("INVALID_FMT", "The fmt chunk is shorter than 16 bytes.");

  const f = formatChunk.dataOffset;
  const audioFormat = view.getUint16(f, true);
  const channels = view.getUint16(f + 2, true);
  const sampleRate = view.getUint32(f + 4, true);
  const byteRate = view.getUint32(f + 8, true);
  const blockAlign = view.getUint16(f + 12, true);
  const bitDepth = view.getUint16(f + 14, true);
  const extraSize = formatChunk.size >= 18 ? view.getUint16(f + 16, true) : 0;

  if (channels === 0) fail("INVALID_CHANNELS", "The channel count must be greater than zero.");
  if (sampleRate === 0) fail("INVALID_SAMPLE_RATE", "The sample rate must be greater than zero.");
  if (blockAlign === 0) fail("INVALID_BLOCK_ALIGN", "Block alignment must be greater than zero.");
  if (formatChunk.size >= 18 && extraSize > formatChunk.size - 18) {
    fail("TRUNCATED_FMT_EXTENSION", "The fmt extension exceeds the chunk boundary.");
  }

  const data = chunks.find((chunk) => chunk.id === "data");
  if (!data) fail("MISSING_DATA", "The WAV has no data chunk.");

  return {
    riffSize,
    fileSize: declaredEnd,
    format: { audioFormat, channels, sampleRate, byteRate, blockAlign, bitDepth, extraSize },
    data,
    chunks,
    durationSeconds: data.size / blockAlign / sampleRate,
    isPcm: audioFormat === 1,
  };
}

export function getPcmBytes(input: ArrayBuffer | Uint8Array, wav = parseWav(input)): Uint8Array {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return bytes.subarray(wav.data.dataOffset, wav.data.dataOffset + wav.data.size);
}
