import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Filter, Loader2 } from 'lucide-react'
import { fetchProsecutionTimeline } from '../lib/interfaceApi'

interface Assertion {
  id: number | string
  claim: string
  source: string
  strength: string
  impeachment: string
  evidence: string
  questions: string[]
}

export function ProsecutionTimelineWorkspace() {
  const [assertions, setAssertions] = useState<Assertion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set())

  useEffect(() => {
    fetchProsecutionTimeline()
      .then(data => {
        setAssertions(data.assertions || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load prosecution timeline from API.')
        setLoading(false)
      })
  }, [])

  const filtered = assertions.filter(a => filter === "all" || a.strength === filter)

  const toggleExpand = (id: number | string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "strong": return <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-xs font-semibold uppercase">Strong</span>
      case "weak": return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs font-semibold uppercase">Weak</span>
      case "suspect": return <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-xs font-semibold uppercase">Suspect</span>
      default: return <span className="px-2 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded text-xs font-semibold uppercase">{strength}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-prosecution)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-base">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-base">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-main mb-2">Prosecution Timeline Deconstruction</h1>
        <p className="text-muted text-sm mb-8">
          Interactive assertion-by-assertion analysis. Identify single-source claims, contradictions, and prepare cross-examination strategies.
        </p>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate pb-4 flex-wrap">
          <div className="flex items-center gap-2 text-muted mr-4">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter by Strength:</span>
          </div>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-[var(--color-prosecution)] text-white" : "bg-panel border border-slate text-muted hover:text-main"}`}
          >
            All ({assertions.length})
          </button>
          <button
            onClick={() => setFilter("weak")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "weak" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50" : "bg-panel border border-slate text-muted hover:text-main"}`}
          >
            Weak ({assertions.filter(a => a.strength === "weak").length})
          </button>
          <button
            onClick={() => setFilter("suspect")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "suspect" ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-panel border border-slate text-muted hover:text-main"}`}
          >
            Suspect ({assertions.filter(a => a.strength === "suspect").length})
          </button>
          <button
            onClick={() => setFilter("strong")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "strong" ? "bg-green-500/20 text-green-500 border border-green-500/50" : "bg-panel border border-slate text-muted hover:text-main"}`}
          >
            Strong ({assertions.filter(a => a.strength === "strong").length})
          </button>
        </div>

        {/* Data Table */}
        {assertions.length === 0 ? (
          <div className="bg-panel border border-slate rounded-lg p-12 text-center text-muted">
            No assertions found. Upload intake files to generate prosecution timeline assertions.
          </div>
        ) : (
          <div className="bg-panel border border-slate rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-elevated border-b border-slate text-muted">
                <tr>
                  <th className="px-6 py-4 font-medium w-12"></th>
                  <th className="px-6 py-4 font-medium">Prosecution Claim</th>
                  <th className="px-6 py-4 font-medium">Source / Witness</th>
                  <th className="px-6 py-4 font-medium">Strength Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate text-main">
                {filtered.map(assertion => (
                  <React.Fragment key={assertion.id}>
                    <tr>
                      <td
                        onClick={() => toggleExpand(assertion.id)}
                        className="px-6 py-4 text-muted hover:text-main cursor-pointer"
                      >
                        {expanded.has(assertion.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4 font-medium pr-12" onClick={() => toggleExpand(assertion.id)}>
                        {assertion.claim}
                      </td>
                      <td className="px-6 py-4 text-muted">{assertion.source}</td>
                      <td className="px-6 py-4">
                        {getStrengthBadge(assertion.strength)}
                      </td>
                    </tr>

                    {expanded.has(assertion.id) && (
                      <tr className="bg-elevated/50 border-t border-dashed border-slate/50">
                        <td colSpan={4} className="px-16 py-6">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="mb-4">
                                <h4 className="text-xs font-semibold uppercase text-muted mb-1 tracking-wider">Impeachment Strategy</h4>
                                <p className="text-main bg-panel p-3 rounded border border-slate/50 text-sm leading-relaxed">
                                  {assertion.impeachment || 'No impeachment strategy recorded.'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted mb-1 tracking-wider">Supporting Evidence</h4>
                                <p className="text-main bg-panel p-3 rounded border border-slate/50 text-sm leading-relaxed">
                                  {assertion.evidence || 'No supporting evidence recorded.'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted mb-2 tracking-wider flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-prosecution)]"></div>
                                Cross-Examination Questions
                              </h4>
                              {assertion.questions && assertion.questions.length > 0 ? (
                                <ul className="space-y-2">
                                  {assertion.questions.map((q: string, i: number) => (
                                    <li key={i} className="bg-panel p-3 rounded border border-slate/50 text-sm flex gap-3 text-main">
                                      <span className="text-muted font-mono">{i + 1}.</span>
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted text-sm italic">No questions generated for this assertion.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
