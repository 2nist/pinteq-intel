// src/lib/interfaceApi.ts

const API_BASE_URL = 'http://localhost:8000/api/intel'

export async function fetchTimelineData(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/timeline?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch timeline data')
  return response.json()
}

export async function fetchNetworkData(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/network?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch network data')
  return response.json()
}

export async function fetchEvidenceGaps(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/evidence-gaps?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch evidence gaps')
  return response.json()
}

export async function fetchEvidenceSearch(query: string, caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/search?case_id=${caseId}&query=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Failed to fetch search results')
  return response.json()
}

export async function fetchWitnesses(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/witnesses?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch witnesses')
  return response.json()
}

// ── Phase 1: New endpoints ──────────────────────────────────────────────

export async function fetchFulltextSearch(query: string, caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/search/fulltext?case_id=${caseId}&query=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Failed to fetch fulltext search results')
  return response.json()
}

export async function fetchPhoneRecords(caseId: string = 'default', number?: string) {
  let url = `${API_BASE_URL}/phone-records?case_id=${caseId}`
  if (number) url += `&number=${encodeURIComponent(number)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch phone records')
  return response.json()
}

// ── Phase 2: Entity & enhanced endpoints ────────────────────────────────

export async function fetchEntities(caseId: string = 'default', entityType?: string) {
  let url = `${API_BASE_URL}/entities?case_id=${caseId}`
  if (entityType) url += `&entity_type=${encodeURIComponent(entityType)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch entities')
  return response.json()
}

export async function fetchProsecutionTimeline(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/prosecution-timeline?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch prosecution timeline')
  return response.json()
}

// ── Phase 3: Enhanced evidence gaps v2 ──────────────────────────────────

export async function fetchEvidenceGapsV2(caseId: string = 'default') {
  const response = await fetch(`${API_BASE_URL}/evidence-gaps/v2?case_id=${caseId}`)
  if (!response.ok) throw new Error('Failed to fetch enhanced evidence gaps')
  return response.json()
}
