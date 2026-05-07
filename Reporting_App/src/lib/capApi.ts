// src/lib/capApi.ts

const CAP_API_BASE = 'https://api.case.law/v1'

// The API key provided by the user in doc/matt.co
export const CAP_API_KEY = '493e0c10-b807-4ff8-a1ae-e4f0f6176a49'

export interface CaseSearchResult {
  id: number
  name: string
  name_abbreviation: string
  decision_date: string
  docket_number: string
  court: { name: string }
  jurisdiction: { name: string }
  url: string
  preview?: string
  highlights?: string[]
}

export interface CapApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: CaseSearchResult[]
}

export async function searchCases(query: string, limit: number = 10): Promise<CapApiResponse> {
  const url = new URL(`${CAP_API_BASE}/cases/`)
  url.searchParams.append('search', query)
  url.searchParams.append('page_size', limit.toString())
  
  // Try to search for state appellate, federal habeas, Brady/Giglio, forensic-error, etc.
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Token ${CAP_API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error(`CAP API error: ${response.statusText}`)
  }

  return response.json()
}

// Map evidence triggers to case law queries
export const TRIGGER_MAP: Record<string, string[]> = {
  'cell site': ['cell site analysis', 'cell tower data'],
  'CAST report': ['CAST report', 'FBI CAST', 'historical cell site'],
  'latent print': ['latent print reliability', 'fingerprint error'],
  'photo lineup': ['photo lineup suggestiveness', 'eyewitness misidentification'],
  'confession': ['coerced confession', 'false confession'],
  'Miranda': ['Miranda violation', 'custodial interrogation'],
  'gang': ['gang enhancement prejudice', 'gang expert testimony'],
  'trajectory': ['bullet trajectory analysis', 'shooting reconstruction'],
  'DNA mixture': ['DNA mixture interpretation', 'probabilistic genotyping']
}

export async function searchByTrigger(trigger: string): Promise<CapApiResponse> {
  const queries = TRIGGER_MAP[trigger] || [trigger]
  // Join queries with OR if possible, or just use the first for simplicity
  const queryString = queries.join(' OR ')
  return searchCases(queryString)
}
