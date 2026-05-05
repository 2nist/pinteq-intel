export function ProsecutionTimelineWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold text-main mb-1">Prosecution Timeline Deconstruction</h1>
        <p className="text-muted text-sm mb-8">
          Map the prosecution's narrative against documentary evidence — identify conflicts,
          exaggerations, and fabrications.
        </p>
        <div
          className="border-l-4 rounded-lg border border-slate bg-panel p-6 text-sm text-muted"
          style={{ borderLeftColor: 'var(--color-prosecution)' }}
        >
          <p className="font-medium text-main mb-1" style={{ color: 'var(--color-prosecution)' }}>
            Phase 7 — Planned
          </p>
          <p>
            Side-by-side: prosecution claim vs documentary source vs defense rebuttal.
            Exportable as attorney-grade deconstruction report.
          </p>
        </div>
      </div>
    </div>
  )
}
