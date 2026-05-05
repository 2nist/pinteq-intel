/**
 * Tool Registry — single source of truth for all nav items / workspaces.
 *
 * To add a new investigation service:
 *   1. Add an entry here.
 *   2. Create its workspace component (e.g. src/components/MyToolWorkspace.tsx).
 *   3. Import and wire it in AppShell.tsx's WORKSPACE_MAP.
 *
 * The left nav, ViewState union, and routing are all derived from this file.
 */

export interface ToolDef {
  /** Unique route / view identifier — used as the ViewState union member */
  id: string
  /** Display label shown in the left nav */
  label: string
  /** CSS color value (hex, var(), etc.) used for active accent */
  accent: string
  /** Optional grouping header shown above this item */
  group?: string
  /** If true, item is pinned to the bottom of the nav (e.g. Settings) */
  bottom?: boolean
}

export const TOOL_REGISTRY: ToolDef[] = [
  // ── Core investigation workspaces ───────────────────────────────────────
  { id: 'dashboard',             label: 'Dashboard',                accent: 'var(--accent-saffron)',    group: 'Overview' },
  { id: 'b4-briefs',             label: 'B4 Witness Briefs',        accent: 'var(--color-b4)',          group: 'Witnesses' },

  // ── Timeline & events ───────────────────────────────────────────────────
  { id: 'timeline',              label: 'Timeline Reconstruction',  accent: 'var(--color-timeline)',    group: 'Analysis' },
  { id: 'prosecution-timeline',  label: 'Prosecution Timeline',     accent: 'var(--color-prosecution)' },

  // ── Communications & networks ────────────────────────────────────────────
  { id: 'phone-analysis',        label: 'Phone Analysis',           accent: 'var(--color-phone)',       group: 'Communications' },
  { id: 'contact-graph',         label: 'Contact Network',          accent: 'var(--color-graph)' },

  // ── Evidence ─────────────────────────────────────────────────────────────
  { id: 'evidence-gap',          label: 'Evidence Gap Analysis',    accent: 'var(--color-gap)',         group: 'Evidence' },

  // ── System ───────────────────────────────────────────────────────────────
  { id: 'settings',              label: 'Settings',                 accent: 'var(--border-slate)',      bottom: true },
]

/** Derived union type — automatically stays in sync with the registry */
export type ViewState = typeof TOOL_REGISTRY[number]['id']
