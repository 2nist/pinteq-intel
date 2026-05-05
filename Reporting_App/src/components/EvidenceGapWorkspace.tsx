export function EvidenceGapWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold text-main mb-1">Evidence Gap Analysis</h1>
        <p className="text-muted text-sm mb-8">
          Systematic audit of missing evidence, Brady material, and investigative deficiencies.
        </p>
        <div
          className="border-l-4 rounded-lg border border-slate bg-panel p-6 text-sm text-muted"
          style={{ borderLeftColor: 'var(--color-gap)' }}
        >
          <p className="font-medium text-main mb-1" style={{ color: 'var(--color-gap)' }}>
            Phase 7 — Planned
          </p>
          <p>
            Gap matrix mapping available evidence against required chain-of-custody points.
            Exportable gap report with attorney-facing finding summaries.
          </p>
        </div>
      </div>
    </div>
  )
}
