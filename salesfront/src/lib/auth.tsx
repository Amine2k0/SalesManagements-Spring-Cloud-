import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, request, tokenStore } from './api'

interface Session {
  username: string
  expiresAt: number
}

type Status = 'checking' | 'signed-in' | 'signed-out'

interface AuthContextValue {
  status: Status
  session: Session | null
  /** Why the last session ended, when it ended on its own. */
  notice: string | null
  signIn: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readToken(token: string): Session | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    return { username: payload.sub, expiresAt: payload.exp * 1000 }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<Status>('checking')
  const [notice, setNotice] = useState<string | null>(null)

  const end = useCallback(
    (reason: string | null) => {
      tokenStore.clear()
      setSession(null)
      setStatus('signed-out')
      setNotice(reason)
      queryClient.clear()
    },
    [queryClient],
  )

  // Confirm a stored token with the auth service before trusting it.
  useEffect(() => {
    const token = tokenStore.get()
    const stored = token ? readToken(token) : null
    if (!token || !stored || stored.expiresAt <= Date.now()) {
      if (token) tokenStore.clear()
      setStatus('signed-out')
      return
    }
    let cancelled = false
    request<{ username: string }>('auth', '/api/auth/me')
      .then((me) => {
        if (cancelled) return
        setSession({ username: me.username, expiresAt: stored.expiresAt })
        setStatus('signed-in')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.unavailable) {
          // The auth service is down, not the token: keep the session it already proved.
          setSession(stored)
          setStatus('signed-in')
        } else {
          end('Your session is no longer valid. Sign in again.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [end])

  // End the session when the token expires.
  useEffect(() => {
    if (!session) return
    const remaining = session.expiresAt - Date.now()
    const timer = window.setTimeout(() => end('Your session expired. Sign in again to continue.'), Math.max(remaining, 0))
    return () => window.clearTimeout(timer)
  }, [session, end])

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await request<{ jwt: string }>('auth', '/api/auth/login', {
      method: 'POST',
      body: { username, password },
      auth: false,
    })
    const next = readToken(result.jwt)
    if (!next) throw new ApiError(500, 'auth', 'The server returned an unreadable token.')
    tokenStore.set(result.jwt)
    setNotice(null)
    setSession(next)
    setStatus('signed-in')
  }, [])

  const register = useCallback(
    async (username: string, password: string) => {
      await request('auth', '/api/auth/register', { method: 'POST', body: { username, password }, auth: false })
      await signIn(username, password)
    },
    [signIn],
  )

  const signOut = useCallback(() => end(null), [end])

  const value = useMemo(
    () => ({ status, session, notice, signIn, register, signOut }),
    [status, session, notice, signIn, register, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
