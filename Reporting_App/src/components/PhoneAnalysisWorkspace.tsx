export function PhoneAnalysisWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold text-main mb-1">Phone Analysis Reports</h1>
        <p className="text-muted text-sm mb-8">
          CDR charting, call pattern analysis, and tower location mapping.
        </p>
        <div
          className="border-l-4 rounded-lg border border-slate bg-panel p-6 text-sm text-muted"
          style={{ borderLeftColor: 'var(--color-phone)' }}
        >
          <p className="font-medium text-main mb-1" style={{ color: 'var(--color-phone)' }}>
            Phase 5 — Planned
          </p>
          <p>
            Recharts-powered CDR visualization: call frequency heat maps, contact graphs by number,
            and exportable phone analysis narrative.
          </p>
        </div>
      </div>
    </div>
  )
}
