/**
 * aiApi.ts — Gemini-powered AI integration for the Intel app.
 *
 * Uses the Gemini API (gemini-2.0-flash) for tasks like:
 *   - Case Law AI Summary generation
 *   - Contradiction detection from evidence descriptions
 *   - Discovery gap analysis
 *
 * ── Setup ─────────────────────────────────────────────────────────────
 * Set VITE_GEMINI_API_KEY in your .env file or environment:
 *   VITE_GEMINI_API_KEY=your-gemini-api-key-here
 *
 * You can get a free API key at https://aistudio.google.com/apikey
 * ─────────────────────────────────────────────────────────────────────
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { text?: string }[]
        }
    }[]
    error?: { message: string }
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured — set VITE_GEMINI_API_KEY in .env')
        return 'AI analysis unavailable: Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.'
    }

    const contents: any[] = []
    if (systemInstruction) {
        contents.push({
            role: 'user',
            parts: [{ text: `[System instruction: ${systemInstruction}]` }]
        })
        contents.push({
            role: 'model',
            parts: [{ text: 'Understood. I will follow these instructions.' }]
        })
    }
    contents.push({
        role: 'user',
        parts: [{ text: prompt }]
    })

    try {
        const resp = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                },
            }),
        })

        if (!resp.ok) {
            const errBody = await resp.text()
            console.warn('Gemini API returned', resp.status, errBody)
            return `AI analysis temporarily unavailable (${resp.status}). Please try again shortly.`
        }

        const data: GeminiResponse = await resp.json()
        if (data.error) {
            return `AI error: ${data.error.message}`
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        return text || 'AI returned an empty response.'
    } catch (err) {
        console.warn('Gemini API call failed:', err)
        return 'AI analysis failed due to a network error. Please check your connection and try again.'
    }
}

// ─── Case Law AI Summary ────────────────────────────────────────────

export async function generateCaseLawSummary(
    query: string,
    cases: { name: string; court: string; date: string; url: string }[]
): Promise<string> {
    const caseList = cases
        .map((c, i) => `${i + 1}. ${c.name} — ${c.court} (${c.date})`)
        .join('\n')

    const prompt = `I searched for case law related to: "${query}"

Here are the relevant cases found:
${caseList}

Please provide a concise AI analysis:
1. What is the prevailing legal trend or precedent for this topic?
2. Are there any notable holdings that favor the defense?
3. What key questions should the defense attorney ask based on these precedents?
4. Any strategic recommendations for how to use these cases in court?

Keep the response to 3-5 paragraphs. Be specific and cite case names where relevant.`

    return callGemini(prompt, 'You are a criminal defense legal analyst. Analyze case law findings and provide actionable insights for a defense attorney. Be specific, cite cases, and focus on defense strategy.')
}

// ─── Contradiction Matrix Analysis ──────────────────────────────────

export interface ContradictionEntry {
    topic: string
    statementA: string
    statementB: string
    significance: string
}

export interface AIContradictionResult {
    analysis: string
    suggestedEntries: ContradictionEntry[]
}

export async function analyzeContradictions(
    witnessName: string,
    statements: { date: string; summary: string; source: string }[]
): Promise<AIContradictionResult> {
    const statementLog = statements
        .map((s) => `[${s.date}] "${s.summary}" — Source: ${s.source}`)
        .join('\n')

    const prompt = `Analyze the following statements from witness "${witnessName}" for contradictions:

${statementLog}

Identify any inconsistencies, contradictions, or changes in the witness's account. For each contradiction found, provide:
1. Topic: The subject matter of the contradiction
2. Statement A: What they said first
3. Statement B: What they said later (that contradicts)
4. Significance: Why this matters for impeachment

Also provide a brief overall analysis paragraph.`

    const text = await callGemini(prompt, 'You are a criminal defense litigation analyst. Analyze witness statements for contradictions and inconsistencies that can be used for impeachment at trial. Be specific and cite exact claims.')

    // Parse out structured entries from the AI response
    const entries: ContradictionEntry[] = []
    const lines = text.split('\n')
    let currentTopic = ''
    let currentA = ''
    let currentB = ''
    let currentSig = ''

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.toLowerCase().startsWith('topic') || trimmed.toLowerCase().startsWith('**topic')) {
            if (currentTopic && currentA && currentB) {
                entries.push({ topic: currentTopic, statementA: currentA, statementB: currentB, significance: currentSig || 'See analysis above' })
            }
            currentTopic = trimmed.replace(/^[\*\s]*(Topic|topic)[:\s]*/i, '').trim()
            currentA = ''
            currentB = ''
            currentSig = ''
        } else if (trimmed.toLowerCase().startsWith('statement a') || trimmed.toLowerCase().startsWith('**statement a')) {
            currentA = trimmed.replace(/^[\*\s]*(Statement A|statement a)[:\s]*/i, '').trim()
        } else if (trimmed.toLowerCase().startsWith('statement b') || trimmed.toLowerCase().startsWith('**statement b')) {
            currentB = trimmed.replace(/^[\*\s]*(Statement B|statement b)[:\s]*/i, '').trim()
        } else if (trimmed.toLowerCase().startsWith('significance') || trimmed.toLowerCase().startsWith('**significance')) {
            currentSig = trimmed.replace(/^[\*\s]*(Significance|significance)[:\s]*/i, '').trim()
        }
    }
    // Push last entry
    if (currentTopic && currentA && currentB) {
        entries.push({ topic: currentTopic, statementA: currentA, statementB: currentB, significance: currentSig || 'See analysis above' })
    }

    // Extract the analysis part (everything before the first structured entry)
    const analysisEnd = text.indexOf('Topic') >= 0 ? text.indexOf('Topic') : text.length
    const analysis = (analysisEnd > 0 ? text.substring(0, analysisEnd) : text).trim()

    return {
        analysis: analysis || text,
        suggestedEntries: entries.slice(0, 10), // Limit to 10
    }
}

// ─── Discovery Gap Detection ────────────────────────────────────────

export interface DiscoveryGap {
    category: string
    issue: string
    recommendation: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function detectDiscoveryGaps(
    caseContext: {
        caseName: string
        evidenceTypes: string[]
        witnesses: string[]
        entities: string[]
    }
): Promise<{ analysis: string; gaps: DiscoveryGap[] }> {
    const prompt = `Analyze this criminal case for potential discovery gaps:

Case: ${caseContext.caseName}
Evidence types available: ${caseContext.evidenceTypes.join(', ') || 'None listed'}
Witnesses/entities: ${caseContext.witnesses.join(', ') || caseContext.entities.join(', ') || 'None listed'}

Identify potential discovery gaps or missing evidence that the defense should investigate. For each gap provide:
1. Category (e.g., "Missing Phone Records", "Uncalled Witness", "Forensic Gap")
2. Issue description
3. Recommended action for the defense
4. Priority (HIGH, MEDIUM, or LOW)

Also provide a brief overall assessment paragraph.`

    const text = await callGemini(prompt, 'You are a criminal defense investigator. Identify discovery gaps — missing evidence, uncalled witnesses, forensic oversights, or Brady/Giglio material that the defense should pursue. Be practical and actionable.')

    // Parse structured gaps from the response
    const gaps: DiscoveryGap[] = []
    const lines = text.split('\n')
    let currentCategory = ''
    let currentIssue = ''
    let currentRec = ''
    let currentPriority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.toLowerCase().startsWith('category') || trimmed.toLowerCase().startsWith('**category')) {
            if (currentCategory && currentIssue) {
                gaps.push({ category: currentCategory, issue: currentIssue, recommendation: currentRec || 'Investigate further', priority: currentPriority })
            }
            currentCategory = trimmed.replace(/^[\*\s]*(Category|category)[:\s]*/i, '').trim()
            currentIssue = ''
            currentRec = ''
            currentPriority = 'MEDIUM'
        } else if (trimmed.toLowerCase().startsWith('issue') || trimmed.toLowerCase().startsWith('**issue')) {
            currentIssue = trimmed.replace(/^[\*\s]*(Issue|issue)[:\s]*/i, '').trim()
        } else if (trimmed.toLowerCase().startsWith('recommendation') || trimmed.toLowerCase().startsWith('recommended') || trimmed.toLowerCase().startsWith('**recommendation')) {
            currentRec = trimmed.replace(/^[\*\s]*(Recommendation|recommended action|recommendation)[:\s]*/i, '').trim()
        } else if (trimmed.toLowerCase().startsWith('priority') || trimmed.toLowerCase().startsWith('**priority')) {
            const p = trimmed.replace(/^[\*\s]*(Priority|priority)[:\s]*/i, '').trim().toUpperCase()
            if (p.includes('HIGH')) currentPriority = 'HIGH'
            else if (p.includes('LOW')) currentPriority = 'LOW'
            else currentPriority = 'MEDIUM'
        }
    }
    if (currentCategory && currentIssue) {
        gaps.push({ category: currentCategory, issue: currentIssue, recommendation: currentRec || 'Investigate further', priority: currentPriority })
    }

    const analysisEnd = text.indexOf('Category') >= 0 ? text.indexOf('Category') : text.length
    const analysis = (analysisEnd > 0 ? text.substring(0, analysisEnd) : text).trim()

    return {
        analysis: analysis || text,
        gaps: gaps.slice(0, 15),
    }
}
