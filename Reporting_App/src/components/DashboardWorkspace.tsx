import { useState, useEffect } from 'react'
import { Loader2, Users, FileText, FileSpreadsheet, Phone, Network, Globe } from 'lucide-react'
import { fetchWitnesses, fetchEvidenceGapsV2, fetchPhoneRecords, fetchEntities, fetchTimelineData, fetchNetworkData } from '../lib/interfaceApi'

interface DashboardStats {
  witnesses: number
  documents: number
  briefs: number
  phoneRecords: number
  entities: number
  networkNodes: number
  timelineItems: number
  pendingProcessing: number
  susceptibility: number
}

export function DashboardWorkspace() {
  const [stats, setStats] = useState<DashboardStats>({
    witnesses: 0,
    documents: 0,
    briefs: 0,
    phoneRecords: 0,
    entities: 0,
    networkNodes: 0,
    timelineItems: 0,
    pendingProcessing: 0,
    susceptibility: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    Promise.allSettled([
      fetchWitnesses().catch(() => []),
      fetchEvidenceGapsV2().catch(() => ({ distribution: [], registry: [], entities: [] })),
      fetchPhoneRecords().catch(() => ({ summary: {} })),
      fetchEntities().catch(() => []),
      fetchTimelineData().catch(() => ({ timeline: [] })),
      fetchNetworkData().catch(() => ({ nodes: [] })),
    ]).then(([witnessesResult, gapsResult, phoneResult, entitiesResult, timelineResult, networkResult]) => {
      const witnessesData = witnessesResult.status === 'fulfilled' ? witnessesResult.value : []
      const gapsData = gapsResult.status === 'fulfilled' ? gapsResult.value : { distribution: [], entities: [] }
      const phoneData = phoneResult.status === 'fulfilled' ? phoneResult.value : { summary: {} }
      const entitiesData = entitiesResult.status === 'fulfilled' ? entitiesResult.value : []
      const timelineData = timelineResult.status === 'fulfilled' ? timelineResult.value : { timeline: [] }
      const networkData = networkResult.status === 'fulfilled' ? networkResult.value : { nodes: [] }

      const distribution = gapsData.distribution || []
      const docCount = distribution.reduce((sum: number, d: any) => sum + (d.strong || 0), 0)
      const pending = distribution.reduce((sum: number, d: any) => sum + (d.weak || 0), 0)
      const suspectCount = distribution.find((d: any) => d.category === 'Has Suspects')?.suspect || 0

      setStats({
        witnesses: Array.isArray(witnessesData) ? witnessesData.length : 0,
        documents: docCount,
        briefs: 0, // B4 briefs tracked separately via B4 server
        phoneRecords: phoneData.summary?.total_records ?? 0,
        entities: Array.isArray(entitiesData) ? entitiesData.length : (gapsData.entities?.length ?? 0),
        networkNodes: networkData.nodes?.length ?? 0,
        timelineItems: timelineData.timeline?.length ?? 0,
        pendingProcessing: pending,
        susceptibility: suspectCount,
      })
      setLoading(false)
    })
  }, [])

  const summaryCards = [
    { label: 'Witnesses Found', count: stats.witnesses, color: 'var(--color-b4)', icon: Users },
    { label: 'Documents Processed', count: stats.documents, color: '#1E6B3C', icon: FileText },
    { label: 'B4 Briefs', count: stats.briefs, color: 'var(--accent-saffron)', icon: FileSpreadsheet },
    { label: 'Phone Records', count: stats.phoneRecords, color: 'var(--color-phone)', icon: Phone },
    { label: 'Network Nodes', count: stats.networkNodes, color: 'var(--color-network)', icon: Network },
    { label: 'Timeline Events', count: stats.timelineItems, color: 'var(--color-timeline)', icon: Globe },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl">
        <h1 className="text-xl font-semibold text-main mb-1">Dashboard</h1>
        <p className="text-muted text-sm mb-8">People v. West — NSPD 2016-05264</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-4">
          {summaryCards.map(card => (
            <div key={card.label} className="border border-slate bg-panel rounded-lg p-5 flex flex-col justify-center relative overflow-hidden">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted mb-1" />
              ) : (
                <>
                  <card.icon
                    className="absolute top-3 right-3 w-8 h-8 opacity-10"
                    style={{ color: card.color }}
                  />
                  <div
                    className="text-2xl font-bold mb-1 transition-all"
                    style={{ color: card.color }}
                  >
                    {card.count}
                  </div>
                </>
              )}
              <div className="text-sm text-muted">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Second Row: Risk / Pending Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="border border-slate bg-panel rounded-lg p-4 flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Pending Processing</span>
            <span className="text-lg font-bold text-yellow-500 mt-1">{loading ? '—' : stats.pendingProcessing}</span>
          </div>
          <div className="border border-slate bg-panel rounded-lg p-4 flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Entities Extracted</span>
            <span className="text-lg font-bold text-main mt-1">{loading ? '—' : stats.entities}</span>
          </div>
          <div className="border border-slate bg-panel rounded-lg p-4 flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Suspect Data Points</span>
            <span className="text-lg font-bold text-red-500 mt-1">{loading ? '—' : stats.susceptibility}</span>
          </div>
        </div>

        <div className="mt-8 border border-slate bg-panel rounded-lg p-6 text-center text-muted text-sm">
          Select a reporting module from the left navigation to begin analysis.
        </div>
      </div>
    </div>
  )
}
