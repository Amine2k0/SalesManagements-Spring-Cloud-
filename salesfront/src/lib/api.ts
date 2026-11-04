import type { Area } from './types'

/**
 * Empty by default: the app calls /api on its own origin and the dev server proxies to the
 * gateway. Set VITE_API_URL (e.g. http://localhost:8989) to call a gateway directly.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'carnet.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  readonly status: number
  readonly area: Area
  readonly body: unknown

  constructor(status: number, area: Area, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.area = area
    this.body = body
  }

  /** The service behind this area is down or unreachable, as opposed to a rejected request. */
  get unavailable(): boolean {
    return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
}

export async function request<T>(area: Area, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, area, 'The server could not be reached.')
  }

  const text = await response.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed (${response.status})`
    // The gateway answers 500 when a registered service refuses the connection.
    const refused = response.status === 500 && typeof message === 'string' && /connection refused/i.test(message)
    throw new ApiError(refused ? 503 : response.status, area, message, data)
  }

  return data as T
}
