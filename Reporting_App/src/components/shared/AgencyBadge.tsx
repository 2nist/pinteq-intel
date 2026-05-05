/** Small agency badge pip — overlaid bottom-right on a WitnessAvatar */

export type Agency = 'NSPD' | 'MSP' | 'FPPD' | 'MTPD' | 'GRPD' | 'KCSO'

const AGENCY_ABBR: Record<Agency, string> = {
  NSPD: 'NP',
  MSP:  'SP',
  FPPD: 'FP',
  MTPD: 'MT',
  GRPD: 'GR',
  KCSO: 'KC',
}

const AGENCY_COLOR: Record<Agency, string> = {
  NSPD: '#1d4ed8',
  MSP:  '#065f46',
  FPPD: '#92400e',
  MTPD: '#581c87',
  GRPD: '#1e40af',
  KCSO: '#7f1d1d',
}

interface Props {
  agency: Agency
}

export function AgencyBadge({ agency }: Props) {
  const bg    = AGENCY_COLOR[agency] ?? '#374151'
  const abbr  = AGENCY_ABBR[agency] ?? agency.slice(0, 2)

  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 rounded-full border border-base flex items-center justify-center text-white font-bold"
      style={{ fontSize: '7px', background: bg }}
      title={agency}
    >
      {abbr}
    </div>
  )
}

/** Derive agency from role description string */
export function inferAgency(role: string): Agency | null {
  const r = role.toUpperCase()
  if (r.includes('NSPD')) return 'NSPD'
  if (r.includes('MSP'))  return 'MSP'
  if (r.includes('FPPD')) return 'FPPD'
  if (r.includes('MTPD')) return 'MTPD'
  if (r.includes('GRPD')) return 'GRPD'
  if (r.includes('KCSO')) return 'KCSO'
  return null
}
