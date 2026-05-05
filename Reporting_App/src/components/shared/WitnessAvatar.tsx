import { useRef, useState } from 'react'

export type RoleTag = 'defendant' | 'victim' | 'star' | 'civilian' | 'leo' | 'forensic' | 'attorney'

const ROLE_COLORS: Record<RoleTag, string> = {
  defendant: '#ef4444',
  victim:    '#f97316',
  star:      'var(--color-b4)',
  civilian:  '#64748b',
  leo:       '#60a5fa',
  forensic:  '#10b981',
  attorney:  '#a78bfa',
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts.at(0)![0] + parts.at(-1)![0]).toUpperCase()
}

interface Props {
  witnessId: number
  name: string
  role: RoleTag
  /** px size — default 40 for roster, 64 for brief header */
  size?: 40 | 64
  className?: string
  /** When provided, avatar becomes a click-to-upload target */
  onUpload?: (file: File) => void
}

export function WitnessAvatar({ witnessId, name, role, size = 40, className = '', onUpload }: Props) {
  const [imgError, setImgError] = useState(false)
  const [hover, setHover]       = useState(false)
  const fileRef                 = useRef<HTMLInputElement>(null)
  const color                   = ROLE_COLORS[role] ?? '#64748b'
  const fontSize                = size <= 40 ? '12px' : '20px'
  const dim                     = `${size}px`
  const canUpload               = !!onUpload

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
      setImgError(false) // optimistically reset so new photo shows
    }
    // reset so same file can be re-picked
    e.target.value = ''
  }

  const inner = !imgError ? (
    <img
      src={`http://localhost:3001/api/witnesses/${witnessId}/photo`}
      alt={name}
      width={size}
      height={size}
      className="w-full h-full object-cover object-top"
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      className="w-full h-full flex items-center justify-center font-semibold select-none"
      style={{ background: `${color}22`, color, fontSize }}
    >
      {getInitials(name)}
    </div>
  )

  const sharedClass = `relative shrink-0 rounded-full overflow-hidden border-2 ${className}`
  const sharedStyle = { width: dim, height: dim, borderColor: hover && canUpload ? '#c9a84c' : color }
  const overlay = canUpload && hover && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 rounded-full pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width={size <= 40 ? 12 : 18} height={size <= 40 ? 12 : 18} viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      {size > 40 && <span className="text-[9px] font-semibold tracking-wider mt-0.5" style={{ color: '#c9a84c' }}>UPLOAD</span>}
    </div>
  )
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      aria-label="Upload witness photo"
      title="Upload witness photo"
      className="sr-only"
      onChange={handleFileChange}
    />
  )

  if (canUpload) {
    return (
      <button
        type="button"
        className={`${sharedClass} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-saffron`}
        style={sharedStyle}
        title="Click to upload a photo"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileRef.current?.click()}
      >
        {inner}{overlay}{fileInput}
      </button>
    )
  }

  return (
    <div className={sharedClass} style={sharedStyle} title={name}>
      {inner}
    </div>
  )
}