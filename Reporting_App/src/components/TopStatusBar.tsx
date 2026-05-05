import { Search } from 'lucide-react'
import { FormEvent, useState } from 'react'

interface Props {
  onSearch: (query: string) => void
  caseLabel?: string
}

export function TopStatusBar({ onSearch, caseLabel = 'People v. West' }: Props) {
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
          <span className="font-medium text-muted">Matter:</span>
          <select className="bg-base border border-slate rounded px-2 py-1 outline-none focus:border-saffron h-[28px] max-w-[160px] truncate cursor-pointer hover:bg-elevated transition-colors text-main">
            <option>{caseLabel}</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-muted border border-slate rounded px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-b4)] inline-block" />
            KENT-25-7082
          </span>
        </div>
      </div>
    </header>
  )
}
