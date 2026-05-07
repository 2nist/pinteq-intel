import { useState, useEffect } from 'react'
import { Search, FileText, Video, Image, Database, Filter, Loader2, FileAudio, FileSpreadsheet } from 'lucide-react'
import { fetchEvidenceSearch } from '../lib/interfaceApi'

export function EvidenceSearchTool() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      fetchEvidenceSearch(query)
        .then(data => {
          setResults(data.results || [])
        })
        .catch(err => {
          console.error("Search failed:", err)
          setResults([])
        })
        .finally(() => {
          setLoading(false)
        })
    }, 400) // Debounce 400ms

    return () => clearTimeout(timer)
  }, [query])

  const getIcon = (category: string) => {
    switch (category) {
      case 'images': return <Image className="w-4 h-4 text-purple-500" />
      case 'video': return <Video className="w-4 h-4 text-blue-500" />
      case 'audio': return <FileAudio className="w-4 h-4 text-green-500" />
      case 'documents': return <FileText className="w-4 h-4 text-saffron" />
      case 'spreadsheets': return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
      default: return <FileText className="w-4 h-4 text-slate" />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base">
      <div className="p-4 border-b border-slate bg-panel shrink-0">
        <h2 className="text-sm font-semibold text-main mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          Intake Evidence Search
        </h2>
        
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search raw documents, OCR text, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-elevated border border-slate rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 text-main placeholder:text-muted"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <button className="flex items-center gap-1 bg-elevated border border-slate px-2 py-1 rounded text-muted hover:text-main">
            <Filter className="w-3 h-3" /> Filters
          </button>
          <button className="flex items-center gap-1 bg-elevated border border-slate px-2 py-1 rounded text-muted hover:text-main">
            <FileText className="w-3 h-3" /> Docs
          </button>
          <button className="flex items-center gap-1 bg-elevated border border-slate px-2 py-1 rounded text-muted hover:text-main">
            <Video className="w-3 h-3" /> Media
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {query ? (
          loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-muted mb-1">
                Found {results.length} results
              </div>
              {results.map((r, i) => (
                <div key={i} className="bg-elevated border border-slate rounded-lg p-3 hover:border-saffron transition-colors cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-base p-1.5 rounded border border-slate group-hover:border-saffron/30 transition-colors">
                      {getIcon(r.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-main truncate group-hover:text-saffron transition-colors">
                        {r.filename}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-base px-1.5 py-0.5 rounded border border-slate">
                          {r.category || 'UNKNOWN'}
                        </span>
                        {r.subtype && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-base px-1.5 py-0.5 rounded border border-slate">
                            {r.subtype}
                          </span>
                        )}
                      </div>
                      {r.snippet && (
                        <div className="mt-2 text-[11px] text-muted line-clamp-2 leading-relaxed bg-base/50 p-1.5 rounded font-mono break-all">
                          {r.snippet}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted text-center py-8">
              No results found for "{query}"
            </div>
          )
        ) : (
          <div className="text-center py-10">
            <Database className="w-8 h-8 text-slate mx-auto mb-3" />
            <p className="text-sm font-medium text-main">Evidence Database</p>
            <p className="text-xs text-muted mt-1 max-w-[250px] mx-auto">
              Search across all normalized documents, extracted communications, and media ingested by the pipeline.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
