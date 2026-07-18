import { useMemo, useState, type ChangeEvent } from "react";
import { ALL_PAD_IDS, assignPadsFromFileNames, type PadId } from "@sp404-toolkit/core";
import { parseWav } from "@sp404-toolkit/wav";

type ImportedSample = {
  id: string;
  fileName: string;
  pad: PadId | null;
  summary: string;
  error: string | null;
};

export function App() {
  const [samples, setSamples] = useState<ImportedSample[]>([]);
  const byPad = useMemo(() => new Map(samples.filter((s) => s.pad).map((s) => [s.pad, s])), [samples]);

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const assignments = assignPadsFromFileNames(files.map((file) => file.name));
    const imported = await Promise.all(
      files.map(async (file, index): Promise<ImportedSample> => {
        try {
          const wav = parseWav(await file.arrayBuffer());
          const format = wav.format;
          return {
            id: crypto.randomUUID(),
            fileName: file.name,
            pad: assignments[index]?.pad ?? null,
            summary: `${format.sampleRate} Hz · ${format.bitDepth}-bit · ${format.channels === 1 ? "mono" : `${format.channels} ch`} · ${wav.durationSeconds.toFixed(2)} s`,
            error: wav.isPcm ? null : "Not linear PCM",
          };
        } catch (error) {
          return {
            id: crypto.randomUUID(),
            fileName: file.name,
            pad: assignments[index]?.pad ?? null,
            summary: "Could not read WAV metadata",
            error: error instanceof Error ? error.message : "Unknown import error",
          };
        }
      }),
    );
    setSamples(imported);
    event.target.value = "";
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Foundation v0.1</p>
          <h1>SP404 Toolkit</h1>
          <p className="lede">A local-first workspace for preparing WAV samples.</p>
        </div>
        <span className="status">Roland export: not yet available</span>
      </header>

      <section className="import-panel" aria-labelledby="import-title">
        <div>
          <h2 id="import-title">Import WAV files</h2>
          <p>Files are inspected on this device and are never uploaded.</p>
        </div>
        <label className="button">
          Choose WAV files
          <input type="file" accept="audio/wav,.wav" multiple onChange={importFiles} />
        </label>
      </section>

      {samples.some((sample) => sample.error) && (
        <section className="errors" aria-live="polite">
          {samples.filter((sample) => sample.error).map((sample) => (
            <p key={sample.id}><strong>{sample.fileName}:</strong> {sample.error}</p>
          ))}
        </section>
      )}

      <section aria-labelledby="pads-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">120 pads · A–J</p>
            <h2 id="pads-title">Pad grid</h2>
          </div>
          <span>{samples.filter((sample) => sample.pad).length} assigned</span>
        </div>
        <div className="pad-grid">
          {ALL_PAD_IDS.map((pad) => {
            const sample = byPad.get(pad);
            return (
              <article className={`pad ${sample ? "occupied" : ""}`} key={pad}>
                <strong>{pad}</strong>
                {sample ? (
                  <>
                    <span title={sample.fileName}>{sample.fileName}</span>
                    <small>{sample.summary}</small>
                  </>
                ) : <small>Empty</small>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
