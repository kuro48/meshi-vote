import { useSessionStore } from '@/store/sessionStore'

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSessionStore.getState().participantToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) headers['X-Participant-Token'] = token

  const res = await fetch(`/api${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
