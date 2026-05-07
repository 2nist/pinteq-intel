import { Search } from 'lucide-react'
import { FormEvent, useState } from 'react'

interface Props {
  onSearch: (query: string) => void
  onAction?: (action: string) => void
  caseLabel?: string
}

export function TopStatusBar({ onSearch, onAction, caseLabel = 'People v. West' }: Props) {
  const [query, setQuery] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <header className="h-[56px] border-b border-slate bg-panel flex items-center justify-between px-4 text-sm shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 font-semibold text-base min-w-[240px]">
        <div className="w-2 h-2 bg-saffron rounded-full" />
        <span className="text-main font-semibold tracking-tight">pinteq</span>
        <span className="text-muted font-normal">· Analysis & Reporting</span>
      </div>

      {/* Global search */}
      <form onSubmit={submit} className="flex-1 max-w-xl mx-8 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search witnesses, events, documents…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-base border border-slate rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-saffron text-main placeholder:text-muted"
        />
      </form>

      {/* Case + matter selectors */}
      <div className="flex gap-4 text-sm text-main items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted">Client Matter:</span>
          <select className="bg-base border border-slate rounded px-2 py-1 outline-none focus:border-saffron h-[28px] max-w-[200px] truncate cursor-pointer hover:bg-elevated transition-colors text-main">
            <optgroup label="Crusader Law LLC">
              <option>{caseLabel} (Active)</option>
              <option>State v. Barnes</option>
            </optgroup>
            <optgroup label="Defense Group Inc.">
              <option>U.S. v. Thompson</option>
            </optgroup>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onAction?.('toggle_tools')}
            className="flex items-center gap-1.5 bg-slate/10 hover:bg-slate/20 text-muted border border-slate/30 transition-colors px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider mr-2"
          >
            Toggle Tools
          </button>
          <button 
            onClick={() => onAction?.('compile_report')}
            className="flex items-center gap-1.5 bg-saffron/10 hover:bg-saffron/20 text-saffron border border-saffron/30 transition-colors px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider"
          >
            Compile Report
          </button>
        </div>
      </div>
    </header>
  )
}
