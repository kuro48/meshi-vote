import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  participantId: string | null
  participantToken: string | null
  nickname: string | null
  roomCode: string | null
  roomId: string | null
  setSession: (data: {
    participantId: string
    participantToken: string
    nickname: string
    roomCode: string
    roomId: string
  }) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      participantId: null,
      participantToken: null,
      nickname: null,
      roomCode: null,
      roomId: null,
      setSession: (data) => set(data),
      clearSession: () =>
        set({
          participantId: null,
          participantToken: null,
          nickname: null,
          roomCode: null,
          roomId: null,
        }),
    }),
    { name: 'meshi-vote-session' }
  )
)
