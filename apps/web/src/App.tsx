import { useMemo, useState, type ChangeEvent } from "react";
import { ALL_PAD_IDS, type PadId, type ProjectTarget, type ValidationMessage } from "@sp404-toolkit/core";
import {
  assignWorkflowPad,
  createProjectWorkflow,
  importWavSources,
  openProjectManifest,
  relinkSource,
  relinkUniqueSources,
  serializeProjectManifest,
  setProjectTarget,
  summarizeWorkflow,
  unassignWorkflowSample,
  workflowDiagnostics,
} from "./workflow.js";

function sampleFormat(sample: ReturnType<typeof createProjectWorkflow>["project"]["samples"][number]): string {
  const metadata = sample.metadata;
  if (
    metadata.sampleRate === undefined
    || metadata.bitDepth === undefined
    || metadata.channels === undefined
    || metadata.durationSeconds === undefined
  ) return "WAV metadata unavailable";
  const channels = metadata.channels === 1 ? "mono" : metadata.channels === 2 ? "stereo" : `${metadata.channels} ch`;
  return `${metadata.sampleRate} Hz · ${metadata.bitDepth}-bit · ${channels} · ${metadata.durationSeconds.toFixed(2)} s`;
}

function diagnosticText(diagnostic: ValidationMessage): string {
  return diagnostic.suggestedAction
    ? `${diagnostic.message} ${diagnostic.suggestedAction}`
    : diagnostic.message;
}

export function App() {
  const [workflow, setWorkflow] = useState(() => createProjectWorkflow());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const summary = useMemo(() => summarizeWorkflow(workflow), [workflow]);
  const diagnostics = useMemo(() => workflowDiagnostics(workflow), [workflow]);
  const diagnosticsBySample = useMemo(() => {
    const grouped = new Map<string, ValidationMessage[]>();
    for (const diagnostic of diagnostics) {
      if (!diagnostic.sampleId) continue;
      grouped.set(diagnostic.sampleId, [...(grouped.get(diagnostic.sampleId) ?? []), diagnostic]);
    }
    return grouped;
  }, [diagnostics]);
  const byPad = useMemo(
    () => new Map(workflow.project.samples.flatMap((sample) => sample.pad ? [[sample.pad, sample] as const] : [])),
    [workflow.project.samples],
  );

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      setWorkflow(await importWavSources(workflow, files));
      setNotice(`${files.length} WAV ${files.length === 1 ? "file" : "files"} added locally.`);
    } finally {
      setBusy(false);
    }
  }

  async function openManifest(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (workflow.project.samples.length > 0 && !window.confirm("Replace the current project with this manifest?")) return;
    setBusy(true);
    try {
      setWorkflow(openProjectManifest(await file.text()));
      setNotice("Manifest opened. Relink the local WAV sources to inspect them again.");
    } catch (error) {
      setNotice(error instanceof Error ? `Manifest not opened: ${error.message}` : "Manifest not opened.");
    } finally {
      setBusy(false);
    }
  }

  async function relinkFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    try {
      const relinked = await relinkUniqueSources(workflow, files);
      setWorkflow(relinked.workflow);
      const linked = relinked.results.filter(({ status }) => status === "linked").length;
      const ambiguous = relinked.results.filter(({ status }) => status === "ambiguous").length;
      const unmatched = relinked.results.filter(({ status }) => status === "unmatched").length;
      setNotice(`Relinked ${linked}; ambiguous ${ambiguous}; unmatched ${unmatched}.`);
    } finally {
      setBusy(false);
    }
  }

  async function relinkOne(sampleId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const linked = await relinkSource(workflow, sampleId, file);
      setWorkflow(linked.workflow);
      setNotice(linked.result.status === "linked"
        ? `${file.name} relinked.`
        : "The selected filename does not exactly match this manifest entry.");
    } finally {
      setBusy(false);
    }
  }

  function assignPad(sampleId: string, pad: PadId) {
    const result = assignWorkflowPad(workflow, sampleId, pad);
    setWorkflow(result.workflow);
    setNotice(result.diagnostic ? diagnosticText(result.diagnostic) : `Assigned ${pad}.`);
  }

  function unassign(sampleId: string) {
    const result = unassignWorkflowSample(workflow, sampleId);
    setWorkflow(result.workflow);
    setNotice(result.diagnostic ? diagnosticText(result.diagnostic) : "Sample left unassigned.");
  }

  function downloadManifest() {
    const blob = new Blob([serializeProjectManifest(workflow)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sp404-project.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Portable project manifest downloaded. No WAV audio or browser objects were included.");
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Reliable SX/A project workflow</p>
          <h1>SP404 Toolkit</h1>
          <p className="lede">Inspect local WAV files, validate them and build a portable pad plan.</p>
        </div>
        <span className="status">Roland hardware export: not available</span>
      </header>

      <section className="compatibility-notice" aria-label="Compatibility notice">
        <strong>Project planning only.</strong> The selected target records your intent; it does not assert
        hardware compatibility and does not create proprietary Roland files.
      </section>

      <section className="toolbar" aria-label="Project actions">
        <label className="target-field">
          Project target
          <select
            value={workflow.project.target}
            disabled={busy}
            onChange={(event) => setWorkflow(setProjectTarget(workflow, event.target.value as ProjectTarget))}
          >
            <option value="SP404SX">SP-404SX</option>
            <option value="SP404A">SP-404A</option>
          </select>
        </label>
        <label className="button primary">
          Add WAV files
          <input disabled={busy} type="file" accept="audio/wav,.wav" multiple onChange={importFiles} />
        </label>
        <label className="button">
          Open manifest
          <input disabled={busy} type="file" accept="application/json,.json" onChange={openManifest} />
        </label>
        <label className="button">
          Relink WAV files
          <input disabled={busy} type="file" accept="audio/wav,.wav" multiple onChange={relinkFiles} />
        </label>
        <button className="button" type="button" disabled={busy} onClick={downloadManifest}>Download manifest</button>
      </section>

      {notice && <p className="notice" aria-live="polite">{notice}</p>}

      <section className="summary-grid" aria-label="Project summary">
        {([
          ["Samples", summary.total],
          ["Assigned", summary.assigned],
          ["Unassigned", summary.unassigned],
          ["Errors", summary.errors],
          ["Warnings", summary.warnings],
          ["Missing sources", summary.missingSources],
        ] as const).map(([label, value]) => (
          <article key={label}><strong>{value}</strong><span>{label}</span></article>
        ))}
      </section>

      <section aria-labelledby="samples-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Local, non-destructive analysis</p>
            <h2 id="samples-title">Samples</h2>
          </div>
          <span>{workflow.project.target}</span>
        </div>
        {workflow.project.samples.length === 0 ? (
          <div className="empty-state">Add one or more WAV files, or open a portable project manifest.</div>
        ) : (
          <div className="sample-list">
            {workflow.project.samples.map((sample) => {
              const sampleDiagnostics = diagnosticsBySample.get(sample.id) ?? [];
              const linked = workflow.sources.has(sample.id);
              return (
                <article className="sample-row" key={sample.id}>
                  <div className="sample-identity">
                    <strong>{sample.displayName}</strong>
                    <span title={sample.fileName}>{sample.fileName}</span>
                    <small>{sampleFormat(sample)}</small>
                  </div>
                  <div className="assignment-controls">
                    <label>
                      Pad
                      <select
                        value={sample.pad ?? ""}
                        disabled={busy}
                        onChange={(event) => {
                          if (event.target.value) assignPad(sample.id, event.target.value as PadId);
                        }}
                      >
                        <option value="">Unassigned</option>
                        {ALL_PAD_IDS.map((pad) => (
                          <option key={pad} value={pad}>
                            {pad}{byPad.has(pad) && byPad.get(pad)?.id !== sample.id ? " · occupied" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    {sample.pad && <button type="button" disabled={busy} onClick={() => unassign(sample.id)}>Unassign</button>}
                  </div>
                  <div className={`source-state ${linked ? "linked" : "missing"}`}>
                    <strong>{linked ? "Source linked" : "Source missing"}</strong>
                    {!linked && (
                      <label>
                        Relink this WAV
                        <input disabled={busy} type="file" accept="audio/wav,.wav" onChange={(event) => void relinkOne(sample.id, event)} />
                      </label>
                    )}
                  </div>
                  <div className="diagnostics">
                    {sampleDiagnostics.length === 0 ? <small>No diagnostics</small> : sampleDiagnostics.map((diagnostic, index) => (
                      <p className={diagnostic.severity} key={`${diagnostic.code}-${index}`}>
                        <strong>{diagnostic.code}</strong> {diagnosticText(diagnostic)}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="pads-section" aria-labelledby="pads-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">120 pads · banks A–J</p>
            <h2 id="pads-title">Pad grid</h2>
          </div>
          <span>{summary.assigned} assigned</span>
        </div>
        <div className="pad-grid">
          {ALL_PAD_IDS.map((pad) => {
            const sample = byPad.get(pad);
            return (
              <article className={`pad ${sample ? "occupied" : ""}`} key={pad}>
                <strong>{pad}</strong>
                {sample ? <span title={sample.fileName}>{sample.displayName}</span> : <small>Empty</small>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
