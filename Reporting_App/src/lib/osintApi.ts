/**
 * osintApi.ts — Thin wrappers for free-tier OSINT APIs.
 *
 * Each function is a self-contained fetcher that handles errors gracefully
 * and returns typed results.  We use real public APIs where possible and
 * keep a consistent pattern so the caller (OSINTSearchWorkspace) can
 * treat every source uniformly.
 *
 * ── Notes on free tiers ──────────────────────────────────────────────
 * • BreachDirectory  – free tier: 100 req/month, email + domain lookup
 * • Hunter.io        – free tier: 25 req/month, email pattern discovery
 * • Numverify        – free tier: 100 req/month, phone validation
 * • WhoisXML         – free tier: 500 req/month, domain ownership
 * • Reddit           – public JSON endpoint (no key needed)
 * ─────────────────────────────────────────────────────────────────────
 */

// ─── Typed result shapes ────────────────────────────────────────────

export interface BreachResult {
    source: 'breachdirectory'
    query: string
    found: boolean
    breaches: { name: string; date: string; compromised: string[] }[]
}

export interface HunterResult {
    source: 'hunter'
    domain: string
    found: boolean
    emails: { value: string; type: string; confidence: number }[]
}

export interface NumverifyResult {
    source: 'numverify'
    number: string
    valid: boolean
    carrier: string
    lineType: string
    location: string
}

export interface WhoisResult {
    source: 'whoisxml'
    domain: string
    found: boolean
    registrantName: string
    registrantOrg: string
    createdDate: string
    registrar: string
}

export interface RedditResult {
    source: 'reddit'
    query: string
    found: boolean
    posts: { title: string; url: string; subreddit: string; score: number; created: string }[]
}

export type OsintResult =
    | BreachResult
    | HunterResult
    | NumverifyResult
    | WhoisResult
    | RedditResult

// ─── BreachDirectory ───────────────────────────────────────────────

const BREACHDIRECTORY_API = 'https://breachdirectory.org/api'

export async function searchBreachDirectory(
    query: string,
    type: 'email' | 'domain' = 'email'
): Promise<BreachResult> {
    const base: BreachResult = {
        source: 'breachdirectory',
        query,
        found: false,
        breaches: [],
    }

    try {
        const resp = await fetch(
            `${BREACHDIRECTORY_API}/lookup?${type}=${encodeURIComponent(query)}`
        )
        if (!resp.ok) {
            // free tier may be rate-limited; return empty gracefully
            console.warn('BreachDirectory returned', resp.status)
            return base
        }
        const data = await resp.json()
        if (!data?.breaches?.length) return base

        return {
            ...base,
            found: true,
            breaches: data.breaches.map((b: any) => ({
                name: b.Name || 'Unknown',
                date: b.BreachDate || '',
                compromised: b.DataClasses || [],
            })),
        }
    } catch (err) {
        console.warn('BreachDirectory lookup failed:', err)
        return base
    }
}

// ─── Hunter.io ──────────────────────────────────────────────────────

// Replace with your free-tier Hunter.io API key, or set via env var
const HUNTER_API_KEY =
    import.meta.env.VITE_HUNTER_API_KEY || ''

export async function searchHunterDomain(
    domain: string
): Promise<HunterResult> {
    const base: HunterResult = {
        source: 'hunter',
        domain,
        found: false,
        emails: [],
    }

    if (!HUNTER_API_KEY) {
        console.warn('Hunter.io API key not configured — set VITE_HUNTER_API_KEY')
        return base
    }

    try {
        const resp = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`
        )
        if (!resp.ok) return base
        const data = await resp.json()
        const emails = data?.data?.emails
        if (!emails?.length) return base

        return {
            ...base,
            found: true,
            emails: emails.map((e: any) => ({
                value: e.value,
                type: e.type,
                confidence: e.confidence,
            })),
        }
    } catch (err) {
        console.warn('Hunter.io lookup failed:', err)
        return base
    }
}

// ─── Numverify ──────────────────────────────────────────────────────

const NUMVERIFY_API_KEY =
    import.meta.env.VITE_NUMVERIFY_API_KEY || ''

export async function searchNumverify(
    phone: string
): Promise<NumverifyResult> {
    const base: NumverifyResult = {
        source: 'numverify',
        number: phone,
        valid: false,
        carrier: '',
        lineType: '',
        location: '',
    }

    if (!NUMVERIFY_API_KEY) {
        console.warn('Numverify API key not configured — set VITE_NUMVERIFY_API_KEY')
        return base
    }

    try {
        const resp = await fetch(
            `https://api.numverify.com/validate?number=${encodeURIComponent(phone)}&api_key=${NUMVERIFY_API_KEY}`
        )
        if (!resp.ok) return base
        const data = await resp.json()
        if (!data?.valid) return base

        return {
            ...base,
            valid: true,
            carrier: data.carrier || '',
            lineType: data.line_type || '',
            location: data.location || '',
        }
    } catch (err) {
        console.warn('Numverify lookup failed:', err)
        return base
    }
}

// ─── WhoisXML ───────────────────────────────────────────────────────

const WHOISXML_API_KEY =
    import.meta.env.VITE_WHOISXML_API_KEY || ''

export async function searchWhoisXml(
    domain: string
): Promise<WhoisResult> {
    const base: WhoisResult = {
        source: 'whoisxml',
        domain,
        found: false,
        registrantName: '',
        registrantOrg: '',
        createdDate: '',
        registrar: '',
    }

    if (!WHOISXML_API_KEY) {
        console.warn('WhoisXML API key not configured — set VITE_WHOISXML_API_KEY')
        return base
    }

    try {
        const resp = await fetch(
            `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`
        )
        if (!resp.ok) return base
        const data = await resp.json()
        const r = data?.WhoisRecord?.registrant || data?.WhoisRecord
        if (!r) return base

        return {
            ...base,
            found: true,
            registrantName: r.name || '',
            registrantOrg: r.organization || '',
            createdDate: r.createdDate || '',
            registrar: data.WhoisRecord?.registrarName || '',
        }
    } catch (err) {
        console.warn('WhoisXML lookup failed:', err)
        return base
    }
}

// ─── Reddit (public JSON) ──────────────────────────────────────────

export async function searchReddit(
    query: string,
    limit: number = 8
): Promise<RedditResult> {
    const base: RedditResult = {
        source: 'reddit',
        query,
        found: false,
        posts: [],
    }

    try {
        const resp = await fetch(
            `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=new&t=all`
        )
        if (!resp.ok) return base
        const data = await resp.json()
        const children = data?.data?.children
        if (!children?.length) return base

        return {
            ...base,
            found: true,
            posts: children.map((c: any) => ({
                title: c.data.title,
                url: `https://reddit.com${c.data.permalink}`,
                subreddit: c.data.subreddit,
                score: c.data.score,
                created: new Date(c.data.created_utc * 1000).toISOString(),
            })),
        }
    } catch (err) {
        console.warn('Reddit search failed:', err)
        return base
    }
}

// ─── Composite search ───────────────────────────────────────────────

export type OsintSource =
    | 'internal'
    | 'breachdirectory'
    | 'hunter'
    | 'numverify'
    | 'whoisxml'
    | 'reddit'

/** Run all available OSINT sources in parallel and return merged results */
export async function searchAllOsint(query: string): Promise<OsintResult[]> {
    const promises: Promise<OsintResult>[] = []

    // Heuristic: if it looks like a domain, run domain-oriented lookups
    const isDomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}$/i.test(query.trim())
    const isPhone = /^\+?\d{7,15}$/.test(query.trim())
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim())

    if (isEmail) {
        promises.push(searchBreachDirectory(query, 'email'))
        const domain = query.split('@')[1]
        promises.push(searchHunterDomain(domain))
    } else if (isDomain) {
        promises.push(searchHunterDomain(query))
        promises.push(searchWhoisXml(query))
        promises.push(searchBreachDirectory(query, 'domain'))
    } else if (isPhone) {
        promises.push(searchNumverify(query))
    } else {
        // Generic — treat as a social/username search
        promises.push(searchReddit(query))
    }

    return Promise.all(promises)
}

/** Source metadata for the UI */
export const OSINT_SOURCE_META: Record<OsintSource, {
    label: string
    description: string
    color: string
    requiresKey: boolean
}> = {
    internal: {
        label: 'Internal Database',
        description: 'Search ingested evidence and documents',
        color: 'var(--accent-terra)',
        requiresKey: false,
    },
    breachdirectory: {
        label: 'BreachDirectory',
        description: 'Email/domain breach & credential leak lookup',
        color: '#ef4444',
        requiresKey: false,
    },
    hunter: {
        label: 'Hunter.io',
        description: 'Email pattern discovery for domains',
        color: '#10b981',
        requiresKey: true,
    },
    numverify: {
        label: 'Numverify',
        description: 'Phone number validation & carrier lookup',
        color: '#f59e0b',
        requiresKey: true,
    },
    whoisxml: {
        label: 'WhoisXML',
        description: 'Domain registration & ownership records',
        color: '#8b5cf6',
        requiresKey: true,
    },
    reddit: {
        label: 'Reddit',
        description: 'Public social media mention search',
        color: '#ff4500',
        requiresKey: false,
    },
}

export const OSINT_SOURCES: OsintSource[] = [
    'internal',
    'breachdirectory',
    'hunter',
    'numverify',
    'whoisxml',
    'reddit',
]
