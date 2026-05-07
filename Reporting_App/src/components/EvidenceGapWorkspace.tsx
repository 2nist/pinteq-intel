import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, AlertTriangle, GitCompare, Search, Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { fetchEvidenceGapsV2, fetchWitnesses, fetchEntities } from '../lib/interfaceApi'
import { analyzeContradictions, detectDiscoveryGaps, type ContradictionEntry, type DiscoveryGap } from '../lib/aiApi'

type TabId = 'evidence-gaps' | 'contradiction-matrix' | 'discovery-gaps'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-elevated border border-slate p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-main mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm flex justify-between gap-4 mb-1" style={{ color: p.fill }}>
            <span className="font-medium capitalize">{p.name}:</span>
            <span>{p.value} claims</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function EvidenceGapWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>('evidence-gaps')

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-base">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-main mb-2">Evidence Gap Analysis</h1>
        <p className="text-muted text-sm mb-8">
          Analyze prosecution claims vs. supporting evidence to identify weaknesses, single-source assertions, and contradictions.
        </p>

        {/* ── Tab Navigation ─────────────────────────────────────────── */}
        <div className="flex gap-1 mb-8 border-b border-slate">
          {[
            { id: 'evidence-gaps' as TabId, label: 'Evidence Gaps', icon: AlertTriangle },
            { id: 'contradiction-matrix' as TabId, label: 'Contradiction Matrix', icon: GitCompare },
            { id: 'discovery-gaps' as TabId, label: 'Discovery Gaps', icon: Search },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === tab.id
                ? 'text-main border-saffron'
                : 'text-muted border-transparent hover:text-main hover:border-slate'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ────────────────────────────────────────────── */}
        {activeTab === 'evidence-gaps' && <EvidenceGapsTab />}
        {activeTab === 'contradiction-matrix' && <ContradictionMatrixTab />}
        {activeTab === 'discovery-gaps' && <DiscoveryGapsTab />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Evidence Gaps (existing functionality)
// ═══════════════════════════════════════════════════════════════════════════

function EvidenceGapsTab() {
  const [gapData, setGapData] = useState<any[]>([])
  const [registry, setRegistry] = useState<any[]>([])
  const [entities, setEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvidenceGapsV2()
      .then(data => {
        setGapData(data.distribution || [])
        setRegistry(data.registry || [])
        setEntities(data.entities || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load enhanced evidence gap data from API.')
        setLoading(false)
      })
  }, [])

  const suspectCount = gapData.find((d: any) => d.category === 'Has Suspects')?.suspect || 0
  const singleSourceCount = entities.filter((e: any) => e.single_source).length
  const totalProcessed = gapData.find((d: any) => d.category === 'Processed Documents')?.strong || 0
  const highImpactCount = registry.filter((r: any) => r.impact === 'HIGH').length
  const mediumImpactCount = registry.filter((r: any) => r.impact === 'MEDIUM').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-evidence)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">{error}</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Chart Card */}
        <div className="bg-panel border border-slate rounded-lg p-6">
          <h2 className="text-sm font-semibold text-main mb-6">Claim Strength Distribution</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={gapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis type="category" dataKey="category" width={120} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="strong" stackId="a" fill="#1E6B3C" name="Strong" radius={[4, 0, 0, 4]} />
                <Bar dataKey="weak" stackId="a" fill="#EAB308" name="Weak" />
                <Bar dataKey="suspect" stackId="a" fill="#991B1B" name="Suspect" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-panel border border-slate rounded-lg p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted">Files Processed</h3>
              <p className="text-3xl font-bold text-green-600 mt-1">{totalProcessed}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-green-600 font-bold">{totalProcessed}</span>
            </div>
          </div>
          <div className="bg-panel border border-slate rounded-lg p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted">Single-Source Entities</h3>
              <p className="text-3xl font-bold text-yellow-500 mt-1">{singleSourceCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <span className="text-yellow-500 font-bold">{singleSourceCount}</span>
            </div>
          </div>
          <div className="bg-panel border border-slate rounded-lg p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted">Suspects Found</h3>
              <p className="text-3xl font-bold text-main mt-1">{suspectCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-elevated border border-slate flex items-center justify-center">
              <span className="text-main font-bold">{suspectCount}</span>
            </div>
          </div>
          <div className="bg-panel border border-slate rounded-lg p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted">Gap Flags</h3>
              <p className="text-3xl font-bold text-red-500 mt-1">{highImpactCount + mediumImpactCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-red-500 font-bold">{highImpactCount + mediumImpactCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      {registry.length > 0 && (
        <div className="bg-panel border border-slate rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate bg-elevated flex justify-between items-center">
            <h3 className="font-semibold text-main">Gap Registry</h3>
            <span className="text-xs text-muted">{registry.length} issues found</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated border-b border-slate text-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Issue Description</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium text-right">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate text-main">
              {registry.map((item, i) => (
                <tr key={i} className="hover:bg-elevated transition-colors">
                  <td className="px-6 py-4 font-medium">{item.category}</td>
                  <td className="px-6 py-4">{item.issue}</td>
                  <td className="px-6 py-4 text-muted">{item.source}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold text-xs px-2 py-1 rounded ${item.impact === 'HIGH' ? 'text-red-500 bg-red-500/10' :
                      item.impact === 'MEDIUM' ? 'text-yellow-500 bg-yellow-500/10' :
                        'text-blue-500 bg-blue-500/10'
                      }`}>
                      {item.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entity Coverage Section */}
      {entities.length > 0 && (
        <div className="bg-panel border border-slate rounded-lg overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-slate bg-elevated flex justify-between items-center">
            <h3 className="font-semibold text-main">Entity Coverage</h3>
            <span className="text-xs text-muted">{entities.length} entities tracked</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated border-b border-slate text-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">File Count</th>
                <th className="px-6 py-3 font-medium text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate text-main">
              {entities.map((entity: any, i: number) => (
                <tr key={i} className="hover:bg-elevated transition-colors">
                  <td className="px-6 py-4 font-medium">{entity.name}</td>
                  <td className="px-6 py-4 text-muted capitalize">{entity.role}</td>
                  <td className="px-6 py-4">{entity.file_count}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold text-xs px-2 py-1 rounded ${entity.single_source ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10'
                      }`}>
                      {entity.single_source ? 'Single Source' : 'Multi-Source'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {registry.length === 0 && entities.length === 0 && (
        <div className="bg-panel border border-slate rounded-lg p-12 text-center text-muted mt-8">
          No evidence gaps or entity data found. Upload intake files to generate analysis.
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: Contradiction Matrix
// ═══════════════════════════════════════════════════════════════════════════

function ContradictionMatrixTab() {
  const [witnesses, setWitnesses] = useState<any[]>([])
  const [selectedWitness, setSelectedWitness] = useState<string>('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [entries, setEntries] = useState<ContradictionEntry[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchWitnesses().then(data => {
      setWitnesses(Array.isArray(data) ? data : [])
    }).catch(() => { })
  }, [])

  const handleAnalyze = async () => {
    if (!selectedWitness) return
    setStatus('loading')
    setAiAnalysis('')
    setEntries([])

    try {
      // Use dummy statement data for the selected witness — in production, fetch real statements
      const dummyStatements = [
        { date: '2025-01-15', summary: `Initial statement to police regarding the incident`, source: 'Police Report' },
        { date: '2025-03-10', summary: `Deposition testimony under oath`, source: 'Deposition Transcript' },
        { date: '2025-06-22', summary: `Preliminary hearing testimony`, source: 'Prelim Transcript' },
      ]

      const result = await analyzeContradictions(selectedWitness, dummyStatements)
      setAiAnalysis(result.analysis)
      setEntries(result.suggestedEntries)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const toggleRow = (idx: number) => {
    const next = new Set(expandedRows)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setExpandedRows(next)
  }

  return (
    <div>
      <div className="bg-panel border border-slate rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-main mb-4 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[var(--color-evidence)]" />
          AI-Powered Contradiction Analysis
        </h2>
        <p className="text-xs text-muted mb-4">
          Select a witness to analyze their statements across multiple sources for contradictions and inconsistencies.
        </p>

        <div className="flex items-center gap-3">
          <select
            value={selectedWitness}
            onChange={e => { setSelectedWitness(e.target.value); setStatus('idle') }}
            className="bg-elevated border border-slate rounded px-3 py-2 text-sm text-main outline-none focus:border-saffron w-64"
          >
            <option value="">Select a witness...</option>
            {witnesses.map((w: any) => (
              <option key={w.id} value={w.full_name}>{w.full_name} ({w.role})</option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={!selectedWitness || status === 'loading'}
            className="px-4 py-2 bg-[var(--accent-terra)] text-white rounded text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            {status === 'loading' ? 'Analyzing with Gemini...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
          Failed to analyze contradictions. Please try again.
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-6">
          {/* AI Analysis Summary */}
          <div className="bg-elevated border border-slate rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-saffron" />
              <h3 className="text-sm font-semibold text-main">Analysis Summary</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
          </div>

          {/* Suggested Entries Table */}
          {entries.length > 0 && (
            <div className="bg-panel border border-slate rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate bg-elevated">
                <h3 className="font-semibold text-main text-sm">Detected Contradictions ({entries.length})</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-elevated border-b border-slate text-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium w-8"></th>
                    <th className="px-6 py-3 font-medium">Topic</th>
                    <th className="px-6 py-3 font-medium">Statement A</th>
                    <th className="px-6 py-3 font-medium">Statement B</th>
                    <th className="px-6 py-3 font-medium">Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate text-main">
                  {entries.map((entry, i) => (
                    <tr key={i} className="hover:bg-elevated transition-colors">
                      <td
                        className="px-6 py-4 text-muted cursor-pointer"
                        onClick={() => toggleRow(i)}
                      >
                        {expandedRows.has(i) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4 font-medium">{entry.topic}</td>
                      <td className="px-6 py-4 text-muted max-w-[200px]">{entry.statementA}</td>
                      <td className="px-6 py-4 text-muted max-w-[200px]">{entry.statementB}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-yellow-500 font-medium">{entry.significance}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {entries.length === 0 && aiAnalysis && (
            <div className="bg-panel border border-slate rounded-lg p-8 text-center text-muted text-sm">
              No specific contradictions were detected in the statements for this witness.
            </div>
          )}
        </div>
      )}

      {status === 'idle' && (
        <div className="bg-panel border border-dashed border-slate rounded-lg p-12 text-center text-muted">
          <GitCompare className="w-10 h-10 text-slate mx-auto mb-3" />
          <p className="text-sm font-medium text-main">Select a Witness</p>
          <p className="text-xs mt-1">Choose a witness and click "Run Analysis" to detect contradictions using Gemini AI.</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3: Discovery Gaps
// ═══════════════════════════════════════════════════════════════════════════

function DiscoveryGapsTab() {
  const [gaps, setGaps] = useState<DiscoveryGap[]>([])
  const [analysis, setAnalysis] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [caseContext, setCaseContext] = useState({ evidenceTypes: '', witnesses: '', entities: '' })

  const handleDetect = async () => {
    setStatus('loading')
    setGaps([])
    setAnalysis('')

    try {
      // Fetch real backend data for context
      const [witnessData, entityData] = await Promise.allSettled([
        fetchWitnesses().catch(() => []),
        fetchEntities().catch(() => []),
      ])

      const witnesses = witnessData.status === 'fulfilled' ? witnessData.value : []
      const entities = entityData.status === 'fulfilled' ? entityData.value : []

      const result = await detectDiscoveryGaps({
        caseName: 'People v. West — NSPD 2016-05264',
        evidenceTypes: caseContext.evidenceTypes.split(',').map(s => s.trim()).filter(Boolean),
        witnesses: caseContext.witnesses.split(',').map(s => s.trim()).filter(Boolean).length > 0
          ? caseContext.witnesses.split(',').map(s => s.trim())
          : (Array.isArray(witnesses) ? witnesses.map((w: any) => w.full_name) : []),
        entities: caseContext.entities.split(',').map(s => s.trim()).filter(Boolean).length > 0
          ? caseContext.entities.split(',').map(s => s.trim())
          : (Array.isArray(entities) ? entities.slice(0, 20).map((e: any) => e.entity_value || e.name).filter(Boolean) : []),
      })

      setAnalysis(result.analysis)
      setGaps(result.gaps)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'text-red-500 bg-red-500/10'
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10'
      case 'LOW': return 'text-blue-500 bg-blue-500/10'
      default: return 'text-muted bg-elevated'
    }
  }

  return (
    <div>
      <div className="bg-panel border border-slate rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-main mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--color-evidence)]" />
          AI-Powered Discovery Gap Detection
        </h2>
        <p className="text-xs text-muted mb-4">
          Identify missing evidence, uncalled witnesses, forensic oversights, or Brady/Giglio material that the defense should pursue.
          The AI uses your case data along with any additional context you provide.
        </p>

        <div className="grid grid-cols-1 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 block">
              Evidence Types (comma-separated, optional override)
            </label>
            <input
              type="text"
              value={caseContext.evidenceTypes}
              onChange={e => setCaseContext(prev => ({ ...prev, evidenceTypes: e.target.value }))}
              placeholder="e.g., Phone Records, Cell Tower Data, DNA, Surveillance Video"
              className="w-full bg-elevated border border-slate rounded px-3 py-2 text-xs text-main placeholder:text-muted outline-none focus:border-saffron"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 block">
                Additional Witnesses
              </label>
              <input
                type="text"
                value={caseContext.witnesses}
                onChange={e => setCaseContext(prev => ({ ...prev, witnesses: e.target.value }))}
                placeholder="Comma-separated names"
                className="w-full bg-elevated border border-slate rounded px-3 py-2 text-xs text-main placeholder:text-muted outline-none focus:border-saffron"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 block">
                Other Entities
              </label>
              <input
                type="text"
                value={caseContext.entities}
                onChange={e => setCaseContext(prev => ({ ...prev, entities: e.target.value }))}
                placeholder="Comma-separated names"
                className="w-full bg-elevated border border-slate rounded px-3 py-2 text-xs text-main placeholder:text-muted outline-none focus:border-saffron"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleDetect}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-[var(--accent-terra)] text-white rounded text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          {status === 'loading' ? 'Analyzing with Gemini...' : 'Detect Discovery Gaps'}
        </button>
      </div>

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
          Failed to detect discovery gaps. Please try again.
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-6">
          {/* AI Analysis */}
          <div className="bg-elevated border border-slate rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-saffron" />
              <h3 className="text-sm font-semibold text-main">Discovery Gap Assessment</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{analysis}</p>
          </div>

          {/* Gaps Table */}
          {gaps.length > 0 && (
            <div className="bg-panel border border-slate rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate bg-elevated">
                <h3 className="font-semibold text-main text-sm">Identified Gaps ({gaps.length})</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-elevated border-b border-slate text-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Issue</th>
                    <th className="px-6 py-3 font-medium">Recommendation</th>
                    <th className="px-6 py-3 font-medium text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate text-main">
                  {gaps.map((gap, i) => (
                    <tr key={i} className="hover:bg-elevated transition-colors">
                      <td className="px-6 py-4 font-medium">{gap.category}</td>
                      <td className="px-6 py-4 text-muted">{gap.issue}</td>
                      <td className="px-6 py-4 text-muted text-xs max-w-[250px]">{gap.recommendation}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold text-xs px-2 py-1 rounded ${getPriorityColor(gap.priority)}`}>
                          {gap.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {status === 'idle' && (
        <div className="bg-panel border border-dashed border-slate rounded-lg p-12 text-center text-muted">
          <Search className="w-10 h-10 text-slate mx-auto mb-3" />
          <p className="text-sm font-medium text-main">Detect Discovery Gaps</p>
          <p className="text-xs mt-1">Click "Detect Discovery Gaps" to use Gemini AI to identify missing evidence and investigative leads.</p>
        </div>
      )}
    </div>
  )
}
