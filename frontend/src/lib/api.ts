const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const TOKEN_KEY = 'dx_token'

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode) - session just won't persist */
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function api<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }

  if (res.status === 401 && token) {
    // Expired / invalid session: drop it and let the app react.
    setToken(null)
    window.dispatchEvent(new Event('dx:session-expired'))
  }

  if (!res.ok) {
    let data: { detail?: string; errors?: Record<string, string> } | null = null
    try {
      data = await res.json()
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(data?.detail ?? `Request failed (${res.status})`, res.status, data?.errors ?? {})
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Builds "?a=1&b=2" from an object, skipping empty values. */
export function qs(params: Record<string, string | boolean | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== false) sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}
