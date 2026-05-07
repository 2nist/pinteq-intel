// src/components/OSINTSearchWorkspace.tsx
import { useState } from 'react'
import { Search, Loader2, Globe, FileText, Database, Shield, Phone, Building, MessageCircle } from 'lucide-react'
import { fetchEvidenceSearch } from '../lib/interfaceApi'
import {
  searchBreachDirectory,
  searchHunterDomain,
  searchNumverify,
  searchWhoisXml,
  searchReddit,
  type OsintSource,
  type OsintResult,
  type BreachResult,
  type HunterResult,
  type NumverifyResult,
  type WhoisResult,
  type RedditResult,
  OSINT_SOURCE_META,
} from '../lib/osintApi'

export function OSINTSearchWorkspace() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [osintResults, setOsintResults] = useState<OsintResult[]>([])
  const [activeSource, setActiveSource] = useState<OsintSource>('internal')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return

    setLoading(true)
    setError(null)
    setResults([])
    setOsintResults([])

    try {
      if (activeSource === 'internal') {
        const data = await fetchEvidenceSearch(query)
        let finalResults = data.results || []
        // Simple client-side filtering by category if needed is handled below
        setResults(finalResults)
      } else {
        // Run the selected OSINT source
        const meta = OSINT_SOURCE_META[activeSource]
        if (meta.requiresKey) {
          // Check if key is configured (just warn, API will handle gracefully)
          console.info(`Running ${activeSource} lookup — if key is unset, results will be empty`)
        }
        await runSingleOsintSource(activeSource, query)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch search results.')
    } finally {
      setLoading(false)
    }
  }

  const runSingleOsintSource = async (source: OsintSource, query: string) => {
    let result: OsintResult

    switch (source) {
      case 'breachdirectory': {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim())
        result = await searchBreachDirectory(query, isEmail ? 'email' : 'domain')
        break
      }
      case 'hunter': {
        const domain = query.trim().replace(/^.*@/, '') // strip email prefix if present
        result = await searchHunterDomain(domain)
        break
      }
      case 'numverify':
        result = await searchNumverify(query)
        break
      case 'whoisxml':
        result = await searchWhoisXml(query)
        break
      case 'reddit':
        result = await searchReddit(query)
        break
      default:
        return
    }

    setOsintResults([result])
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'breachdirectory': return <Shield className="w-4 h-4" />
      case 'hunter': return <Globe className="w-4 h-4" />
      case 'numverify': return <Phone className="w-4 h-4" />
      case 'whoisxml': return <Building className="w-4 h-4" />
      case 'reddit': return <MessageCircle className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const renderOsintResult = (r: OsintResult) => {
    switch (r.source) {
      case 'breachdirectory':
        const breach = r as BreachResult
        return (
          <div key="breach" className="p-3 bg-panel border border-slate rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-main">BreachDirectory</h3>
            </div>
            {breach.found ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Found {breach.breaches.length} breach{breach.breaches.length > 1 ? 'es' : ''} for <span className="font-mono text-main">{breach.query}</span>
                </p>
                {breach.breaches.map((b, i) => (
                  <div key={i} className="bg-elevated border border-slate/50 rounded p-2 text-xs">
                    <div className="font-semibold text-main">{b.name}</div>
                    {b.date && <div className="text-muted">Breach date: {b.date}</div>}
                    {b.compromised.length > 0 && (
                      <div className="text-muted mt-1">
                        Compromised: <span className="font-mono">{b.compromised.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No breaches found for "{breach.query}".</p>
            )}
          </div>
        )

      case 'hunter':
        const hunter = r as HunterResult
        return (
          <div key="hunter" className="p-3 bg-panel border border-slate rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-main">Hunter.io</h3>
            </div>
            {hunter.found ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Found {hunter.emails.length} email pattern{hunter.emails.length > 1 ? 's' : ''} for <span className="font-mono text-main">{hunter.domain}</span>
                </p>
                {hunter.emails.map((e, i) => (
                  <div key={i} className="bg-elevated border border-slate/50 rounded p-2 text-xs flex justify-between">
                    <span className="font-mono text-main">{e.value}</span>
                    <span className="text-muted">{e.type} · {e.confidence}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No email patterns found for "{hunter.domain}".</p>
            )}
          </div>
        )

      case 'numverify':
        const num = r as NumverifyResult
        return (
          <div key="numverify" className="p-3 bg-panel border border-slate rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-main">Numverify</h3>
            </div>
            {num.valid ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Number:</span>
                  <span className="font-mono text-main">{num.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Carrier:</span>
                  <span className="text-main">{num.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Line Type:</span>
                  <span className="text-main">{num.lineType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Location:</span>
                  <span className="text-main">{num.location}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted italic">Number "{num.number}" is invalid or no data returned.</p>
            )}
          </div>
        )

      case 'whoisxml':
        const whois = r as WhoisResult
        return (
          <div key="whois" className="p-3 bg-panel border border-slate rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-main">WhoisXML</h3>
            </div>
            {whois.found ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Domain:</span>
                  <span className="font-mono text-main">{whois.domain}</span>
                </div>
                {whois.registrantName && (
                  <div className="flex justify-between">
                    <span className="text-muted">Registrant:</span>
                    <span className="text-main">{whois.registrantName}</span>
                  </div>
                )}
                {whois.registrantOrg && (
                  <div className="flex justify-between">
                    <span className="text-muted">Organization:</span>
                    <span className="text-main">{whois.registrantOrg}</span>
                  </div>
                )}
                {whois.createdDate && (
                  <div className="flex justify-between">
                    <span className="text-muted">Created:</span>
                    <span className="text-main">{whois.createdDate}</span>
                  </div>
                )}
                {whois.registrar && (
                  <div className="flex justify-between">
                    <span className="text-muted">Registrar:</span>
                    <span className="text-main">{whois.registrar}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No WHOIS data found for "{whois.domain}".</p>
            )}
          </div>
        )

      case 'reddit':
        const reddit = r as RedditResult
        return (
          <div key="reddit" className="p-3 bg-panel border border-slate rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-main">Reddit</h3>
            </div>
            {reddit.found ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Found {reddit.posts.length} post{reddit.posts.length > 1 ? 's' : ''} matching "{reddit.query}"
                </p>
                {reddit.posts.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-elevated border border-slate/50 rounded p-2 text-xs hover:border-orange-500/30 transition-colors"
                  >
                    <div className="font-semibold text-main line-clamp-2">{p.title}</div>
                    <div className="flex justify-between mt-1 text-muted">
                      <span>r/{p.subreddit}</span>
                      <span>▲ {p.score} · {new Date(p.created).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No Reddit posts found for "{reddit.query}".</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-base">
      <div className="w-full">
        <h1 className="text-lg font-semibold text-main mb-1">OSINT Search</h1>
        <p className="text-muted text-sm mb-4">
          Search internal evidence or query external OSINT APIs for intelligence enrichment.
        </p>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col gap-3">
            {/* Source Selector */}
            <div className="flex gap-1.5 flex-wrap">
              {(['internal', 'breachdirectory', 'hunter', 'numverify', 'whoisxml', 'reddit'] as OsintSource[]).map(source => {
                const meta = OSINT_SOURCE_META[source]
                const isActive = activeSource === source
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => {
                      setActiveSource(source)
                      setOsintResults([])
                      setResults([])
                      setError(null)
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors ${isActive
                      ? 'text-white border-transparent'
                      : 'bg-elevated border-slate text-muted hover:text-main hover:border-slate/70'
                      }`}
                    style={isActive ? { backgroundColor: meta.color, borderColor: meta.color } : undefined}
                    title={meta.description}
                  >
                    {getSourceIcon(source)}
                    {meta.label}
                    {meta.requiresKey && (
                      <span className="opacity-60 text-[10px]">🔑</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                className="w-full bg-elevated border border-slate rounded-lg pl-9 pr-3 py-2 text-sm text-main placeholder-muted focus:outline-none focus:border-[var(--accent-terra)] transition-colors"
                placeholder={
                  activeSource === 'internal' ? 'Search entities, metadata, document names...' :
                    activeSource === 'breachdirectory' ? 'Search email address or domain for breaches...' :
                      activeSource === 'hunter' ? 'Enter domain name (e.g. example.com)...' :
                        activeSource === 'numverify' ? 'Enter phone number with country code...' :
                          activeSource === 'whoisxml' ? 'Enter domain name...' :
                            'Enter keyword or username...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[var(--accent-terra)] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex justify-center items-center mt-1"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-terra)] mx-auto mb-4" />
            <p className="text-muted text-sm">
              {activeSource === 'internal'
                ? 'Aggregating OSINT & Internal sources...'
                : `Querying ${OSINT_SOURCE_META[activeSource].label}...`
              }
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg mt-6">
            {error}
          </div>
        )}

        {/* OSINT Results */}
        {!loading && osintResults.length > 0 && (
          <div className="space-y-4 mt-6">
            {osintResults.map(renderOsintResult)}
          </div>
        )}

        {/* Internal Results */}
        {!loading && activeSource === 'internal' && results.length > 0 && !error && (
          <div className="space-y-4 mt-6">
            <h2 className="text-sm font-semibold text-main mb-4">Search Results ({results.length})</h2>
            {results.map((r: any) => (
              <div key={r.id} className="p-3 bg-panel border border-slate rounded-lg flex flex-col gap-2 hover:border-[var(--accent-terra)] transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-main truncate">{r.filename}</h3>
                  <div className="text-xs text-muted flex gap-2 items-center mt-1">
                    <span className="uppercase tracking-wider font-semibold text-[10px] bg-elevated px-1.5 py-0.5 rounded">
                      {r.category || 'UNKNOWN'}
                    </span>
                    {r.subtype && (
                      <span className="uppercase tracking-wider font-semibold text-[10px] bg-elevated px-1.5 py-0.5 rounded">
                        {r.subtype}
                      </span>
                    )}
                  </div>
                </div>
                {r.snippet && (
                  <div className="text-[11px] text-muted line-clamp-2 mt-1 bg-elevated/50 p-1.5 rounded font-mono">
                    {r.snippet}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-500/10 text-green-500">
                    High Match
                  </span>
                  <button className="px-3 py-1.5 text-xs font-medium border border-slate rounded hover:bg-elevated text-main">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && osintResults.length === 0 && (
          activeSource === 'internal' ? (
            <div className="flex flex-col gap-3 mb-6 mt-6">
              <div className="p-3 bg-panel border border-slate rounded-lg flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-main">Public Records</div>
                  <div className="text-xs text-muted">Addresses, Court Data</div>
                </div>
              </div>
              <div className="p-3 bg-panel border border-slate rounded-lg flex items-center gap-3">
                <Database className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-main">Internal Data</div>
                  <div className="text-xs text-muted">Discovery & Files</div>
                </div>
              </div>
              <div className="p-3 bg-panel border border-slate rounded-lg flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-500 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-main">Social Media</div>
                  <div className="text-xs text-muted">Accounts & Mentions</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 mt-6 border border-dashed border-slate rounded-lg bg-panel/30">
              <Search className="w-8 h-8 text-slate mx-auto mb-3" />
              <p className="text-sm font-medium text-main">
                {OSINT_SOURCE_META[activeSource].label}
              </p>
              <p className="text-xs text-muted max-w-[280px] mx-auto mt-1">
                {OSINT_SOURCE_META[activeSource].description}. Enter a query above and click Search.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
