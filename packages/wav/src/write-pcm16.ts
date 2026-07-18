export const PCM16_WAV_HEADER_SIZE = 44;

export type Pcm16WavOptions = {
  channels: 1 | 2;
  sampleRate?: number;
  samples: Int16Array;
};

function writeFourCC(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < 4; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

/** Writes a canonical PCM16 little-endian RIFF/WAVE file. */
export function writePcm16Wav({ channels, sampleRate = 44_100, samples }: Pcm16WavOptions): Uint8Array {
  if (channels !== 1 && channels !== 2) throw new RangeError("PCM16 writer supports one or two channels.");
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) throw new RangeError("Sample rate must be a positive integer.");
  if (samples.length % channels !== 0) throw new RangeError("Interleaved sample count must be divisible by channels.");

  const dataSize = samples.length * 2;
  const bytes = new Uint8Array(PCM16_WAV_HEADER_SIZE + dataSize);
  const view = new DataView(bytes.buffer);
  const blockAlign = channels * 2;

  writeFourCC(bytes, 0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  writeFourCC(bytes, 8, "WAVE");
  writeFourCC(bytes, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeFourCC(bytes, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(PCM16_WAV_HEADER_SIZE + index * 2, samples[index] ?? 0, true);
  }
  return bytes;
}
