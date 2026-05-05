export type StatusLevel = 'strong' | 'weak' | 'none' | 'gap' | 'conflict' | 'critical' | 'ok' | 'high' | 'moderate' | 'low' | 'unknown'

const STYLES: Record<StatusLevel, string> = {
  strong:   'bg-status-success-bg text-status-success-text border-status-success-border',
  ok:       'bg-status-success-bg text-status-success-text border-status-success-border',
  high:     'bg-status-success-bg text-status-success-text border-status-success-border',
  weak:     'bg-status-warning-bg text-status-warning-text border-status-warning-border',
  moderate: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
  gap:      'bg-status-warning-bg text-status-warning-text border-status-warning-border',
  none:     'bg-status-error-bg text-status-error-text border-status-error-border',
  conflict: 'bg-status-error-bg text-status-error-text border-status-error-border',
  critical: 'bg-[#991b1b] text-white border-transparent',
  low:      'bg-status-error-bg text-status-error-text border-status-error-border',
  unknown:  'bg-status-neutral-bg text-status-neutral-text border-status-neutral-border',
}

interface Props {
  status: StatusLevel
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border uppercase ${STYLES[status]} ${className}`}
    >
      {label ?? status}
    </span>
  )
}
