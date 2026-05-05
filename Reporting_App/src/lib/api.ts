export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8001'

export async function apiFetch(path: string, options?: RequestInit) {
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE}${p}`
  return fetch(url, options)
}

export async function apiGet(path: string, options?: RequestInit) {
  return apiFetch(path, { method: 'GET', ...options })
}

export async function apiPost(path: string, body: unknown, options?: RequestInit) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}
