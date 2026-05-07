// ─── B4 Witness Intelligence Brief — full 3-panel React workspace ────────────
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Save, Printer, PlusCircle, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { WitnessAvatar, type RoleTag } from './shared/WitnessAvatar'
import { AgencyBadge, inferAgency } from './shared/AgencyBadge'
import { StatusBadge, type StatusLevel } from './shared/StatusBadge'
import { cn } from '@/lib/utils'

// ── Environment-aware API base URLs ──────────────────────────────────────
// Use Vite proxy in dev, explicit production URLs otherwise.
const B4_SERVER = import.meta.env.VITE_B4_API_URL || 'http://localhost:3001'
const INTEL_API = import.meta.env.VITE_INTEL_API_URL || 'http://localhost:8000/api/intel'


// ── Types ─────────────────────────────────────────────────────────────────────

interface Witness {
  id: number
  full_name: string
  role: string
  role_tag: RoleTag
  matter_id: string
  case_no: string
}

type CredRating = 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN'

interface StatementRow { id: string; date: string; summary: string; source: string; flags: string }
interface ContradictionRow { id: string; topic: string; statementA: string; statementB: string; significance: string }
interface CrossExamRow { id: string; angle: string; basis: string; exhibit: string }
interface SourceRow { id: string; ref: string; type: string; description: string; accessed: string; privilege: string }

interface Brief {
  witness_id?: string
  // §1
  role_in_case: string; aliases: string; dob: string; address: string
  phones: string; relationship: string; language: string; criminal_history: string
  analyst_summary: string
  // §2
  credibility_rating: CredRating
  cred_motive: string; cred_dishonesty: string; cred_bias: string
  cred_consistency: string; cred_osint: string
  // §3–7
  statements: StatementRow[]
  contradictions: ContradictionRow[]
  cross_exam: CrossExamRow[]
  outstanding: string
  sources: SourceRow[]
}

function emptyBrief(): Brief {
  return {
    role_in_case: '', aliases: '', dob: '', address: '', phones: '',
    relationship: '', language: 'English', criminal_history: '', analyst_summary: '',
    credibility_rating: 'UNKNOWN',
    cred_motive: '', cred_dishonesty: '', cred_bias: '', cred_consistency: '', cred_osint: '',
    statements: [], contradictions: [], cross_exam: [], outstanding: '', sources: [],
  }
}

function uid() { return Math.random().toString(36).slice(2) }

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate">
      <div className="w-6 h-6 rounded bg-elevated border border-slate flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
        {number}
      </div>
      <h3 className="text-[13px] font-semibold text-main uppercase tracking-widest">{title}</h3>
    </div>
  )
}

function Field({
  label, value, onChange, textarea = false, rows = 2, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void
  textarea?: boolean; rows?: number; placeholder?: string
}) {
  const cls = 'w-full bg-base border border-slate rounded px-3 py-2 text-[13px] text-main placeholder:text-muted outline-none focus:border-saffron transition-colors resize-none'
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</label>
      {textarea
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

const CRED_BUTTONS: { value: CredRating; label: string; level: StatusLevel }[] = [
  { value: 'HIGH', label: 'HIGH — Reliable', level: 'high' },
  { value: 'MODERATE', label: 'MODERATE — Verify', level: 'moderate' },
  { value: 'LOW', label: 'LOW — Vulnerable', level: 'low' },
  { value: 'UNKNOWN', label: 'UNKNOWN — Insufficient', level: 'unknown' },
]

// ── Witness Photo Fetch Button ────────────────────────────────────────────────

interface PhotoCandidate { thumb: string; full: string; title: string; source: string }

function PhotoFetchButton({ witnessId, onFetched }: { witnessId: number; onFetched: () => void }) {
  const [state, setState] = useState<'idle' | 'searching' | 'picking' | 'saving' | 'done' | 'not_found' | 'error'>('idle')
  const [candidates, setCandidates] = useState<PhotoCandidate[]>([])
  const [errMsg, setErrMsg] = useState('')

  async function handleSearch() {
    setState('searching')
    setCandidates([])
    try {
      const res = await fetch(`${B4_SERVER}/api/witnesses/${witnessId}/photo/fetch-web`, { method: 'POST' })
      const data = await res.json()
      if (data.status === 'already_have') { setState('done'); onFetched(); return }
      if (data.status === 'candidates' && data.candidates?.length) {
        setCandidates(data.candidates)
        setState('picking')
      } else {
        setState('not_found')
      }
    } catch { setState('error'); setErrMsg('Network error') }
  }

  async function handleConfirm(url: string) {
    setState('saving')
    try {
      const res = await fetch(`${B4_SERVER}/api/witnesses/${witnessId}/photo/confirm-web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.status === 'saved') { setState('done'); onFetched() }
      else { setState('error'); setErrMsg(data.error ?? 'Save failed') }
    } catch { setState('error'); setErrMsg('Network error') }
  }

  if (state === 'done') return <div className="text-xs text-status-success-text">✓ Photo saved</div>
  if (state === 'not_found') return <div className="text-xs text-muted italic">No public photo found</div>
  if (state === 'error') return <div className="text-xs text-status-error-text" title={errMsg}>Search failed · <button className="underline" onClick={() => setState('idle')}>retry</button></div>
  if (state === 'searching') return <div className="flex items-center gap-1 text-xs text-muted"><Loader2 className="w-3 h-3 animate-spin" />Searching…</div>
  if (state === 'saving') return <div className="flex items-center gap-1 text-xs text-muted"><Loader2 className="w-3 h-3 animate-spin" />Saving…</div>

  if (state === 'picking') {
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Select correct photo or skip</div>
        <div className="flex gap-2 flex-wrap">
          {candidates.map((c) => (
            <button
              key={c.full}
              onClick={() => handleConfirm(c.full)}
              title={c.title || c.source}
              className="w-12 h-12 rounded border border-slate overflow-hidden hover:border-saffron transition-colors shrink-0"
            >
              <img src={c.thumb || c.full} alt={c.title} className="w-full h-full object-cover" />
            </button>
          ))}
          <button
            onClick={() => setState('idle')}
            className="w-12 h-12 rounded border border-slate text-[10px] text-muted hover:text-main hover:border-slate transition-colors flex items-center justify-center shrink-0"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={handleSearch} className="flex items-center gap-1 text-[11px] text-muted hover:text-main transition-colors" title="Search DuckDuckGo Images for a public photo">
      <ImagePlus className="w-3 h-3" />Find Social Photo
    </button>
  )
}

// ── Generic dynamic-row table ─────────────────────────────────────────────────

function DynTable<T extends { id: string }>({
  rows, onAdd, onRemove, onUpdate, columns,
}: {
  rows: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof T, value: string) => void
  columns: { key: keyof T; label: string; flex?: number; placeholder?: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 && (
        <div className="text-[12px] text-muted italic px-1">No entries yet — click + to add a row</div>
      )}
      {rows.map(row => (
        <div key={row.id} className="flex gap-2 items-start">
          {columns.map(col => (
            <textarea
              key={String(col.key)}
              rows={2}
              value={String(row[col.key] ?? '')}
              onChange={e => onUpdate(row.id, col.key, e.target.value)}
              placeholder={col.placeholder ?? String(col.label)}
              className="bg-base border border-slate rounded px-2 py-1.5 text-[12px] text-main placeholder:text-muted outline-none focus:border-saffron resize-none transition-colors"
              style={{ flex: col.flex ?? 1 }}
            />
          ))}
          <button onClick={() => onRemove(row.id)} title="Remove row" aria-label="Remove row" className="mt-1.5 text-muted hover:text-status-error-text transition-colors shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={onAdd} className="flex items-center gap-1.5 text-[12px] text-muted hover:text-main mt-1 transition-colors">
        <PlusCircle className="w-3.5 h-3.5" />Add row
      </button>
    </div>
  )
}

// ── Main workspace ────────────────────────────────────────────────────────────

export function B4BriefWorkspace() {
  const [witnesses, setWitnesses] = useState<Witness[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [brief, setBrief] = useState<Brief>(emptyBrief())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [photoKey, setPhotoKey] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function bumpPhoto() { setPhotoKey(k => k + 1) }

  async function handlePhotoUpload(file: File) {
    if (!selectedId) return
    setUploadStatus('uploading')
    try {
      const res = await fetch(`${B4_SERVER}/api/witnesses/${selectedId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (res.ok) { setUploadStatus('done'); bumpPhoto(); setTimeout(() => setUploadStatus('idle'), 2500) }
      else setUploadStatus('error')
    } catch { setUploadStatus('error') }
  }

  useEffect(() => {
    fetch(`${INTEL_API}/witnesses`).then(r => r.json()).then(setWitnesses).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedId === null) { setBrief(emptyBrief()); return }
    fetch(`${B4_SERVER}/api/brief/${selectedId}`).then(r => r.json()).then(data => {
      const loaded = { ...emptyBrief(), ...data }
      for (const k of ['statements', 'contradictions', 'cross_exam', 'sources'] as const) {
        if (!Array.isArray(loaded[k])) (loaded as Brief)[k] = [] as never
      }
      setBrief(loaded)
    }).catch(console.error)
  }, [selectedId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (selectedId !== null) saveBrief(selectedId, brief)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const saveBrief = useCallback(async (id: number, data: Brief) => {
    setSaveStatus('saving')
    try {
      await fetch(`${B4_SERVER}/api/brief/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch { setSaveStatus('error') }
  }, [])

  const scheduleAutoSave = useCallback((id: number, data: Brief) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveBrief(id, data), 3000)
  }, [saveBrief])

  function update(patch: Partial<Brief>) {
    const next = { ...brief, ...patch }
    setBrief(next)
    if (selectedId !== null) scheduleAutoSave(selectedId, next)
  }

  type BriefArrayKey = 'statements' | 'contradictions' | 'cross_exam' | 'sources'

  function updateArr(
    key: BriefArrayKey,
    id: string, field: string, value: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = (brief[key] as any[]).map((r: { id: string }) => r.id === id ? { ...r, [field]: value } : r)
    update({ [key]: arr } as Partial<Brief>)
  }

  function addRow(
    key: BriefArrayKey,
    template: Record<string, string>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = [...(brief[key] as any[]), { id: uid(), ...template }]
    update({ [key]: arr } as Partial<Brief>)
  }

  function removeRow(key: 'statements' | 'contradictions' | 'cross_exam' | 'sources', id: string) {
    update({ [key]: (brief[key] as { id: string }[]).filter(r => r.id !== id) } as Partial<Brief>)
  }

  const witness = witnesses.find(w => w.id === selectedId) ?? null
  const agency = witness ? inferAgency(witness.role) : null

  const filtered = witnesses.filter(w =>
    !search || w.full_name.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  )

  const osintLinks = witness ? [
    { label: 'Michigan OTIS', url: `https://mdocweb.state.mi.us/otis2/otis2.aspx` },
    { label: 'MiCOURT', url: `https://courts.michigan.gov` },
    { label: 'ICHAT', url: `https://ichat.state.mi.us/` },
    { label: 'Spokeo', url: `https://www.spokeo.com/search?q=${encodeURIComponent(witness.full_name)}` },
    { label: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(witness.full_name + ' Muskegon Michigan')}` },
    { label: 'Facebook', url: `https://www.facebook.com/search/top/?q=${encodeURIComponent(witness.full_name)}` },
    { label: 'MN DOC (Van Raalte)', url: `https://coms.doc.state.mn.us/publicviewer/` },
  ] : []

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT: Witness Roster ──────────────────────────────────────────── */}
      <aside className="w-[260px] border-r border-slate bg-panel flex flex-col shrink-0">
        <div className="p-3 border-b border-slate">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search witnesses…"
              className="w-full bg-base border border-slate rounded pl-8 pr-3 py-1.5 text-[12px] text-main placeholder:text-muted outline-none focus:border-saffron"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {filtered.map(w => {
            const isActive = w.id === selectedId
            const ag = inferAgency(w.role)
            return (
              <button
                key={w.id}
                onClick={() => setSelectedId(w.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-[3px]',
                  isActive ? 'bg-elevated border-[var(--color-b4)] pl-[9px]' : 'border-transparent hover:bg-elevated'
                )}
              >
                <div className="relative shrink-0">
                  <WitnessAvatar witnessId={w.id} name={w.full_name} role={w.role_tag} size={40} key={`${w.id}-${photoKey}`} />
                  {ag && <div className="absolute bottom-0 right-0"><AgencyBadge agency={ag} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-[12px] font-medium truncate', isActive ? 'text-[var(--color-b4)]' : 'text-main')}>
                    {w.full_name}
                  </div>
                  <div className="text-[10px] text-muted truncate">{w.role}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-3 border-t border-slate text-[10px] text-muted">
          {witnesses.length} witnesses · {witnesses.filter(w => w.role_tag === 'leo').length} LEO · {witnesses.filter(w => w.role_tag === 'civilian').length} civilian
        </div>
      </aside>

      {/* ── CENTER: Brief Form ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-base">
        {!witness ? (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Select a witness from the roster to open or create a brief.
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-6 print:px-0 print:py-0">

            {/* Brief header ──────────────────────────────────────────────── */}
            <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate">
              <div className="relative shrink-0">
                <WitnessAvatar witnessId={witness.id} name={witness.full_name} role={witness.role_tag} size={64} key={`h-${witness.id}-${photoKey}`} onUpload={handlePhotoUpload} />
                {agency && <div className="absolute bottom-0 right-0"><AgencyBadge agency={agency} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                  B4 · Witness Intelligence Brief · Work Product
                </div>
                <h2 className="text-xl font-bold text-main leading-tight">{witness.full_name}</h2>
                <div className="text-[12px] text-muted mt-0.5">{witness.role}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-muted">{witness.matter_id} · {witness.case_no}</span>
                  {uploadStatus === 'uploading' && <span className="flex items-center gap-1 text-xs text-muted"><Loader2 className="w-3 h-3 animate-spin" />Uploading…</span>}
                  {uploadStatus === 'done' && <span className="text-xs text-status-success-text">✓ Photo updated</span>}
                  {uploadStatus === 'error' && <span className="text-xs text-status-error-text">Upload failed</span>}
                  {uploadStatus === 'idle' && <PhotoFetchButton witnessId={witness.id} onFetched={bumpPhoto} />}
                </div>
              </div>
              <div className="flex gap-2 items-start print:hidden shrink-0">
                <button onClick={() => saveBrief(witness.id, brief)} className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated border border-slate rounded text-[12px] text-muted hover:text-main transition-colors">
                  {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated border border-slate rounded text-[12px] text-muted hover:text-main transition-colors">
                  <Printer className="w-3.5 h-3.5" />Print
                </button>
              </div>
            </div>

            {/* § 1 — Witness Overview ─────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="1" title="Witness Overview" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Role in Case" value={brief.role_in_case} onChange={v => update({ role_in_case: v })} placeholder="Prosecution witness / Alleged victim / Co-defendant" />
                <Field label="Known Aliases" value={brief.aliases} onChange={v => update({ aliases: v })} placeholder="N/A" />
                <Field label="Date of Birth" value={brief.dob} onChange={v => update({ dob: v })} placeholder="MM/DD/YYYY" />
                <Field label="Phone Numbers" value={brief.phones} onChange={v => update({ phones: v })} placeholder="Numbers on record" />
                <Field label="Language" value={brief.language} onChange={v => update({ language: v })} placeholder="English" />
                <Field label="Relationship to Client" value={brief.relationship} onChange={v => update({ relationship: v })} placeholder="Known connection" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Current Address" value={brief.address} onChange={v => update({ address: v })} placeholder="Last known address" />
                <Field label="Criminal History" value={brief.criminal_history} onChange={v => update({ criminal_history: v })} textarea rows={2} placeholder="Prior convictions if any" />
                <Field label="Analyst Summary" value={brief.analyst_summary} onChange={v => update({ analyst_summary: v })} textarea rows={4}
                  placeholder="2–3 sentence summary of who this person is, why they matter to this case, and your overall assessment of their reliability. This is the first thing Chuck reads. Make it count." />
              </div>
            </section>

            {/* § 2 — Credibility Assessment ──────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="2" title="Credibility Assessment" />
              <div className="flex gap-2 mb-5 flex-wrap">
                {CRED_BUTTONS.map(b => (
                  <button key={b.value} onClick={() => update({ credibility_rating: b.value })} title={b.label}
                    className={cn('transition-all border rounded px-3 py-1.5 text-[11px] font-semibold',
                      brief.credibility_rating === b.value ? 'ring-2 ring-offset-1 ring-offset-base ring-saffron scale-[1.03]' : 'opacity-60 hover:opacity-80'
                    )}>
                    <StatusBadge status={b.level} label={b.label} />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Motive to Lie" value={brief.cred_motive} onChange={v => update({ cred_motive: v })} textarea rows={2} placeholder="Does this witness have a reason to be untruthful? Pending charges, deals offered, personal animus?" />
                <Field label="Prior Dishonesty" value={brief.cred_dishonesty} onChange={v => update({ cred_dishonesty: v })} textarea rows={2} placeholder="Prior convictions for fraud, perjury, theft, or other crimes of moral turpitude?" />
                <Field label="Bias Indicators" value={brief.cred_bias} onChange={v => update({ cred_bias: v })} textarea rows={2} placeholder="Financial relationship with state? Romantic or family ties to victim or prosecution witness?" />
                <Field label="Consistency History" value={brief.cred_consistency} onChange={v => update({ cred_consistency: v })} textarea rows={2} placeholder="Have they changed their story between initial statement, preliminary hearing, and deposition?" />
                <Field label="OSINT Flags" value={brief.cred_osint} onChange={v => update({ cred_osint: v })} textarea rows={2} placeholder="Anything in public records, social media, or database research that bears on credibility?" />
              </div>
            </section>

            {/* § 3 — Statement Record ─────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="3" title="Statement Record" />
              <DynTable<StatementRow>
                rows={brief.statements}
                onAdd={() => addRow('statements', { date: '', summary: '', source: '', flags: '' })}
                onRemove={id => removeRow('statements', id)}
                onUpdate={(id, f, v) => updateArr('statements', id, f, v)}
                columns={[
                  { key: 'date', label: 'Date', flex: 0.6, placeholder: 'MM/DD/YYYY' },
                  { key: 'summary', label: 'Statement Summary', flex: 3, placeholder: 'Summary — paraphrased, not quoted' },
                  { key: 'source', label: 'Source', flex: 1, placeholder: 'Source A · Police report p.4' },
                  { key: 'flags', label: 'Flags', flex: 1, placeholder: '⛑ Contradicts prior statement' },
                ]}
              />
            </section>

            {/* § 4 — Contradiction Matrix ─────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="4" title="Contradiction Matrix" />
              <DynTable<ContradictionRow>
                rows={brief.contradictions}
                onAdd={() => addRow('contradictions', { topic: '', statementA: '', statementB: '', significance: '' })}
                onRemove={id => removeRow('contradictions', id)}
                onUpdate={(id, f, v) => updateArr('contradictions', id, f, v)}
                columns={[
                  { key: 'topic', label: 'Topic', flex: 1, placeholder: 'Location at incident' },
                  { key: 'statementA', label: 'Statement A', flex: 2, placeholder: '"Claim" · Source, date' },
                  { key: 'statementB', label: 'Statement B', flex: 2, placeholder: '"Conflicting claim" · Source, date' },
                  { key: 'significance', label: 'Significance', flex: 1.5, placeholder: 'Why this matters — impeachment value' },
                ]}
              />
            </section>

            {/* § 5 — Cross-Examination Guide ──────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="5" title="Cross-Examination Guide" />
              <DynTable<CrossExamRow>
                rows={brief.cross_exam}
                onAdd={() => addRow('cross_exam', { angle: '', basis: '', exhibit: '' })}
                onRemove={id => removeRow('cross_exam', id)}
                onUpdate={(id, f, v) => updateArr('cross_exam', id, f, v)}
                columns={[
                  { key: 'angle', label: 'Cross-Examination Angle', flex: 2, placeholder: 'Confront prior inconsistent statement re: location' },
                  { key: 'basis', label: 'Evidentiary Basis', flex: 2.5, placeholder: 'Witness stated X to police but testified Y at prelim — direct conflict on material fact' },
                  { key: 'exhibit', label: 'Exhibit / Doc to Use', flex: 1.5, placeholder: 'Police report p.4 · Prelim transcript p.12' },
                ]}
              />
            </section>

            {/* § 6 — Outstanding Investigation ───────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="6" title="Outstanding Investigation" />
              <Field label="Open Items" value={brief.outstanding} onChange={v => update({ outstanding: v })} textarea rows={6}
                placeholder={'• FOIA request pending — describe what was requested and when\n• Additional OSINT to run — platform, search target, purpose\n• Phone records for date range not yet obtained\n• Witness-to-witness connection not yet confirmed'} />
            </section>

            {/* § 7 — Source Log ───────────────────────────────────────────── */}
            <section className="mb-8">
              <SectionHeader number="7" title="Source Log" />
              <DynTable<SourceRow>
                rows={brief.sources}
                onAdd={() => addRow('sources', {
                  ref: `S-${String(brief.sources.length + 1).padStart(3, '0')}`,
                  type: 'Source A', description: '', accessed: '', privilege: 'Work Product',
                })}
                onRemove={id => removeRow('sources', id)}
                onUpdate={(id, f, v) => updateArr('sources', id, f, v)}
                columns={[
                  { key: 'ref', label: 'Ref', flex: 0.5, placeholder: 'S-001' },
                  { key: 'type', label: 'Type', flex: 0.7, placeholder: 'Source A' },
                  { key: 'description', label: 'Description', flex: 3, placeholder: 'Police interview report — Officer name, date' },
                  { key: 'accessed', label: 'Date Accessed', flex: 0.8, placeholder: 'MM/DD/YYYY' },
                  { key: 'privilege', label: 'Privilege', flex: 1, placeholder: 'Work Product' },
                ]}
              />
            </section>

            {/* Analyst certification ──────────────────────────────────────── */}
            <div className="border-t border-slate pt-4 mt-2 text-[11px] text-muted print:mt-8">
              <p className="font-semibold text-main mb-1">Analyst Certification</p>
              <p>This report was prepared under the supervision of the attorney of record and constitutes attorney work product. All findings are sourced as indicated. Facts and assessments are distinguished throughout. This report does not constitute legal advice.</p>
              <p className="mt-2">Analyst: Pinteq LLC · People v. West · NSPD 2016-05264</p>
            </div>

          </div>
        )}
      </main>

      {/* ── RIGHT: OSINT Links + Brief Stats ─────────────────────────────── */}
      <aside className="w-[240px] border-l border-slate bg-panel flex flex-col shrink-0 print:hidden">
        {witness ? (
          <>
            <div className="p-3 border-b border-slate">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">OSINT Links</div>
              <div className="flex flex-col gap-1">
                {osintLinks.map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-1.5 bg-base border border-slate rounded text-[12px] text-muted hover:text-main hover:border-saffron transition-colors group">
                    <span>{link.label}</span>
                    <span className="opacity-0 group-hover:opacity-60 text-[10px]">↗</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="p-3 border-b border-slate">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Brief Status</div>
              <div className="flex flex-col gap-1.5 text-[11px] text-muted">
                {[
                  ['Statements', brief.statements.length],
                  ['Contradictions', brief.contradictions.length],
                  ['Cross-Exam', brief.cross_exam.length],
                  ['Sources', brief.sources.length],
                ].map(([label, count]) => (
                  <div key={String(label)} className="flex justify-between">
                    <span>{label}</span><span className="text-main font-medium">{count}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-1 pt-1 border-t border-slate items-center">
                  <span>Credibility</span>
                  <StatusBadge status={brief.credibility_rating.toLowerCase() as StatusLevel} label={brief.credibility_rating} />
                </div>
              </div>
            </div>

            {saveStatus !== 'idle' && (
              <div className="px-3 py-2 text-[11px] text-center text-muted border-b border-slate">
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && '✓ Auto-saved'}
                {saveStatus === 'error' && '✕ Save failed'}
              </div>
            )}

            <div className="p-3 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Quick Notes</div>
              <textarea rows={8} placeholder="Scratch pad — not saved to brief…"
                className="w-full bg-base border border-slate rounded px-2 py-1.5 text-[12px] text-main placeholder:text-muted outline-none focus:border-saffron resize-none" />
            </div>
          </>
        ) : (
          <div className="p-4 text-[12px] text-muted">Select a witness to see OSINT links and brief status.</div>
        )}
      </aside>
    </div>
  )
}
