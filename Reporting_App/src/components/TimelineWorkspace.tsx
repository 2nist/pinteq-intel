export function TimelineWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold text-main mb-1">Timeline Reconstruction</h1>
        <p className="text-muted text-sm mb-8">
          Build and visualize the chronology of events from intake documents.
        </p>
        <div
          className="border-l-4 rounded-lg border border-slate bg-panel p-6 text-sm text-muted"
          style={{ borderLeftColor: 'var(--color-timeline)' }}
        >
          <p className="font-medium text-main mb-1" style={{ color: 'var(--color-timeline)' }}>
            Phase 4 — Planned
          </p>
          <p>
            Interactive timeline with event clustering, witness correlation, and date-inferred events
            from the intake document database.
          </p>
        </div>
      </div>
    </div>
  )
}
