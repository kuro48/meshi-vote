import { useSessionStore } from '@/store/sessionStore'
import type { Participant } from '@/types/domain'
import { useRoomQuery } from './useRoom'

export function useParticipant(): Participant | null {
  const { participantId } = useSessionStore()
  const { data } = useRoomQuery()

  if (!participantId || !data) return null
  return data.participants.find((p) => p.id === participantId) ?? null
}
