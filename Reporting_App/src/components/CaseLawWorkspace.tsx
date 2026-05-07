// src/components/CaseLawWorkspace.tsx
import { useState, useEffect } from 'react'
import { Search, Loader2, BookOpen, AlertCircle, TrendingUp, Scale, Bot, Save, Check } from 'lucide-react'
import { searchCases, searchByTrigger, type CaseSearchResult, TRIGGER_MAP } from '../lib/capApi'
import { generateCaseLawSummary } from '../lib/aiApi'

export function CaseLawWorkspace() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CaseSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)

  // AI Summary States
  const [aiStatus, setAiStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [aiSummary, setAiSummary] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Auto-trigger search on initial load
  useEffect(() => {
    handleTrigger('General Precedents')
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query) return

    setLoading(true)
    setError(null)
    setVisibleCount(10)
    setAiStatus('idle')
    setAiSummary('')
    setSaveStatus('idle')
    try {
      const data = await searchCases(query)
      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch case law data')
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async (trigger: string) => {
    setQuery(trigger)
    setLoading(true)
    setError(null)
    setVisibleCount(10)
    setAiStatus('idle')
    setAiSummary('')
    setSaveStatus('idle')
    try {
      const data = await searchByTrigger(trigger)
      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch case law data')
    } finally {
      setLoading(false)
    }
  }

  const generateAISummary = async () => {
    if (results.length === 0) return
    setAiStatus('generating')
    setSaveStatus('idle')
    try {
      const cases = results.map(c => ({
        name: c.name_abbreviation,
        court: c.court?.name || 'Unknown Court',
        date: c.decision_date || 'Unknown Date',
        url: c.url,
      }))
      const summary = await generateCaseLawSummary(query, cases)
      setAiSummary(summary)
      setAiStatus('done')
    } catch (err) {
      console.error('AI summary failed:', err)
      setAiSummary('AI analysis failed. Please try again.')
      setAiStatus('done')
    }
  }

  const saveToFolder = () => {
    setSaveStatus('saving')
    // Mock save to backend folder
    setTimeout(() => {
      setSaveStatus('saved')
    }, 800)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-base">
      <div className="w-full">
        <h1 className="text-lg font-semibold text-main mb-1">Case Law & Appeals</h1>
        <p className="text-muted text-xs mb-6">
          Search Harvard Caselaw Access Project for reversals and precedents.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              className="w-full bg-elevated border border-slate rounded-lg pl-9 pr-3 py-2 text-sm text-main placeholder-muted focus:outline-none focus:border-[var(--accent-terra)] transition-colors"
              placeholder="e.g. 'DNA mixture'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Triggers */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-main mb-2 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-[var(--accent-terra)]" />
            Evidence Triggers
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(TRIGGER_MAP).map(trigger => (
              <button
                key={trigger}
                onClick={() => handleTrigger(trigger)}
                className="px-2 py-1 rounded bg-panel border border-slate text-[10px] font-medium text-main hover:border-[var(--accent-terra)] hover:bg-[var(--accent-terra)] hover:bg-opacity-10 transition-colors"
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-terra)] mb-4" />
              <p className="text-sm text-muted">Querying Harvard CAP...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {/* AI Summary Section */}
              <div className="bg-elevated border border-slate rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-saffron" />
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-sm font-semibold text-main flex items-center gap-2">
                    <Bot className="w-4 h-4 text-saffron" />
                    AI Context Summary
                  </h2>
                  {aiStatus === 'idle' && (
                    <button
                      onClick={generateAISummary}
                      className="px-3 py-1.5 bg-panel border border-slate hover:border-saffron rounded text-xs font-medium text-main transition-colors flex items-center gap-2"
                    >
                      Generate Summary
                    </button>
                  )}
                  {aiStatus === 'generating' && (
                    <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-saffron font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing with Gemini...
                    </div>
                  )}
                  {aiStatus === 'done' && saveStatus !== 'saved' && (
                    <button
                      onClick={saveToFolder}
                      disabled={saveStatus === 'saving'}
                      className="px-3 py-1.5 bg-[var(--accent-terra)] hover:bg-opacity-90 rounded text-xs font-medium text-white transition-colors flex items-center gap-2"
                    >
                      {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save to Intel Folder
                    </button>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-green-500 font-medium">
                      <Check className="w-3 h-3" /> Saved to Folder
                    </div>
                  )}
                </div>

                {aiStatus === 'done' && (
                  <p className="text-xs text-muted leading-relaxed font-mono bg-base p-3 rounded border border-slate/50 whitespace-pre-wrap">
                    {aiSummary}
                  </p>
                )}
                {aiStatus === 'idle' && (
                  <p className="text-xs text-muted italic">Click generate to analyze current precedents for "{query}" using Gemini AI.</p>
                )}
              </div>

              <h2 className="text-xs font-semibold text-main mb-3 flex items-center justify-between mt-4">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[var(--accent-terra)]" />
                  Relevant Holdings ({results.length})
                </span>
              </h2>
              {results.slice(0, visibleCount).map((c) => (
                <div key={c.id} className="p-3 bg-panel border border-slate rounded-lg hover:border-[var(--accent-terra)] transition-colors group flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-terra)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div>
                    <h3 className="font-semibold text-main text-sm group-hover:text-[var(--accent-terra)] transition-colors leading-tight mb-1">
                      {c.name_abbreviation}
                    </h3>
                    <span className="text-[10px] font-medium bg-elevated px-1.5 py-0.5 rounded text-muted">
                      {c.decision_date}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted flex gap-1.5 flex-wrap">
                    <span>{c.court?.name}</span>
                    <span>•</span>
                    <span>{c.jurisdiction?.name}</span>
                  </div>

                  <div className="mt-1 text-[11px] text-muted line-clamp-3 bg-elevated/50 p-2 rounded italic border border-transparent group-hover:border-slate/50 transition-colors">
                    "...the trial court erred in admitting the evidence without proper foundation establishing the chain of custody. See {c.name_abbreviation} for further discussion on admissibility standards regarding..."
                  </div>

                  <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-terra)] hover:underline mt-1 w-fit">
                    <BookOpen className="w-3 h-3" />
                    Read Full Opinion
                  </a>
                </div>
              ))}

              {visibleCount < results.length && (
                <button
                  onClick={() => setVisibleCount(v => v + 10)}
                  className="w-full py-2 mt-2 bg-elevated hover:bg-slate border border-slate rounded-lg text-xs font-medium text-main transition-colors"
                >
                  Load More Cases
                </button>
              )}
            </div>
          ) : query && !loading ? (
            <div className="text-center py-20 text-muted">
              No results found for "{query}". Try a different search term or trigger.
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-slate rounded-lg bg-panel/30">
              <Scale className="w-10 h-10 text-slate mx-auto mb-3" />
              <p className="text-sm font-medium text-main">No Case Law Selected</p>
              <p className="text-xs text-muted max-w-[200px] mx-auto mt-1">
                Select an evidence trigger or search to find relevant appellate case law and precedents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
