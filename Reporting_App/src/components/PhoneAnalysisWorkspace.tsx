import { useState, useEffect } from 'react'
import { fetchPhoneRecords } from '../lib/interfaceApi'
import { Loader2, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, MessageSquare, Search } from 'lucide-react'

interface PhoneRecord {
  record_id: number
  intake_id: number
  party_number: string
  contact_number: string
  direction: string
  duration_seconds: number | null
  timestamp: string | null
  message_content: string | null
  platform: string | null
  record_type: string | null
  source_file: string | null
}

interface PhoneSummary {
  total_records: number
  unique_numbers: number
  total_duration_seconds: number
}

export function PhoneAnalysisWorkspace() {
  const [records, setRecords] = useState<PhoneRecord[]>([])
  const [summary, setSummary] = useState<PhoneSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterNumber, setFilterNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchPhoneRecords('default', filterNumber || undefined)
      .then(data => {
        setRecords(data.records || [])
        setSummary(data.summary || null)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load phone records from API.')
        setLoading(false)
      })
  }, [filterNumber])

  const filtered = searchQuery
    ? records.filter(r =>
      (r.party_number || '').includes(searchQuery) ||
      (r.contact_number || '').includes(searchQuery) ||
      (r.direction || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.platform || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : records

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '—'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return '—'
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return ts
    }
  }

  const getDirectionIcon = (dir: string | null) => {
    switch (dir?.toLowerCase()) {
      case 'incoming': return <PhoneIncoming className="w-3.5 h-3.5 text-green-500" />
      case 'outgoing': return <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />
      case 'missed': return <PhoneCall className="w-3.5 h-3.5 text-red-500" />
      default: return <Phone className="w-3.5 h-3.5 text-muted" />
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-phone)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-base">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-base">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-main mb-2">Phone Analysis</h1>
        <p className="text-muted text-sm mb-8">
          CDR records, call pattern analysis, and message log from the intake pipeline.
        </p>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-panel border border-slate rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-[var(--color-phone)]" />
                <h3 className="text-sm font-medium text-muted">Total Records</h3>
              </div>
              <p className="text-2xl font-bold text-main">{summary.total_records}</p>
            </div>
            <div className="bg-panel border border-slate rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <PhoneCall className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-medium text-muted">Unique Numbers</h3>
              </div>
              <p className="text-2xl font-bold text-main">{summary.unique_numbers}</p>
            </div>
            <div className="bg-panel border border-slate rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-medium text-muted">Total Duration</h3>
              </div>
              <p className="text-2xl font-bold text-main">{formatDuration(summary.total_duration_seconds)}</p>
            </div>
          </div>
        )}

        {/* Filter + Search Bar */}
        <div className="bg-panel border border-slate rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Filter by Number:</label>
            <input
              type="text"
              value={filterNumber}
              onChange={e => setFilterNumber(e.target.value)}
              placeholder="Enter phone number..."
              className="bg-base border border-slate rounded px-3 py-1.5 text-xs text-main placeholder:text-muted outline-none focus:border-blue-500 w-48"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Search className="w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="bg-base border border-slate rounded px-3 py-1.5 text-xs text-main placeholder:text-muted outline-none focus:border-blue-500 w-40"
            />
          </div>
        </div>

        {/* Records Table */}
        {filtered.length === 0 ? (
          <div className="bg-panel border border-slate rounded-lg p-8 text-center text-muted text-sm">
            {records.length === 0
              ? 'No phone records found in the database. Ingest CDR data via the intake pipeline.'
              : 'No records match your search.'}
          </div>
        ) : (
          <div className="bg-panel border border-slate rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-elevated border-b border-slate text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium w-8"></th>
                    <th className="px-4 py-3 font-medium">Party Number</th>
                    <th className="px-4 py-3 font-medium">Contact Number</th>
                    <th className="px-4 py-3 font-medium">Direction</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate text-main">
                  {filtered.map(rec => (
                    <tr key={rec.record_id} className="hover:bg-elevated transition-colors">
                      <td className="px-4 py-3">{getDirectionIcon(rec.direction)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{rec.party_number || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{rec.contact_number || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium capitalize ${rec.direction === 'incoming' ? 'text-green-500' :
                            rec.direction === 'outgoing' ? 'text-blue-500' :
                              rec.direction === 'missed' ? 'text-red-500' : 'text-muted'
                          }`}>
                          {rec.direction || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{formatDuration(rec.duration_seconds)}</td>
                      <td className="px-4 py-3 text-xs">{formatTimestamp(rec.timestamp)}</td>
                      <td className="px-4 py-3 text-xs">{rec.platform || '—'}</td>
                      <td className="px-4 py-3 text-xs">{rec.record_type || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate" title={rec.source_file || ''}>
                        {rec.source_file || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-elevated border-t border-slate text-xs text-muted">
              Showing {filtered.length} of {records.length} records
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
