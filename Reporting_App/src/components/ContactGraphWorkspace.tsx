export function ContactGraphWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold text-main mb-1">Contact Network Graph</h1>
        <p className="text-muted text-sm mb-8">
          Force-directed graph of all known contacts, associations, and relationship clusters.
        </p>
        <div
          className="border-l-4 rounded-lg border border-slate bg-panel p-6 text-sm text-muted"
          style={{ borderLeftColor: 'var(--color-graph)' }}
        >
          <p className="font-medium text-main mb-1" style={{ color: 'var(--color-graph)' }}>
            Phase 6 — Planned
          </p>
          <p>
            react-force-graph visualization of witness/contact network. Nodes: people/orgs.
            Edges: call/co-appearance/family/crew relationships.
          </p>
        </div>
      </div>
    </div>
  )
}
