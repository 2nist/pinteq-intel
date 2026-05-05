export function DashboardWorkspace() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl">
        <h1 className="text-xl font-semibold text-main mb-1">Dashboard</h1>
        <p className="text-muted text-sm mb-8">People v. West — NSPD 2016-05264</p>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Witnesses', count: 30, color: 'var(--color-b4)' },
            { label: 'Documents', count: 96, color: 'var(--color-phone)' },
            { label: 'B4 Briefs', count: 0, color: 'var(--accent-saffron)' },
          ].map(card => (
            <div key={card.label} className="border border-slate bg-panel rounded-lg p-5">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: card.color }}
              >
                {card.count}
              </div>
              <div className="text-sm text-muted">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-slate bg-panel rounded-lg p-6 text-center text-muted text-sm">
          Select a reporting module from the left navigation to begin analysis.
        </div>
      </div>
    </div>
  )
}
