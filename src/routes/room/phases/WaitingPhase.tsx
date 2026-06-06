import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Room, Participant } from '@/types/domain'
import { ShareSheet } from '@/components/room/ShareSheet'
import { Button } from '@/components/ui/Button'
import { advancePhase } from '@/lib/api/rooms'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function WaitingPhase({ room, participants, currentParticipant }: Props) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const isHost = currentParticipant?.role === 'host'

  const handleAdvance = async () => {
    setIsLoading(true)
    try {
      await advancePhase(room.code, 'representatives')
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ShareSheet roomCode={room.code} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-sm text-slate-400 mb-1">参加者 ({participants.length}人)</p>
        <p className="text-slate-200 text-sm">
          {participants.length < 2
            ? 'メンバーが集まるのを待っています...'
            : 'メンバーが揃ったら代表者を選びましょう'}
        </p>
      </div>

      {isHost && (
        <Button
          onClick={handleAdvance}
          isLoading={isLoading}
          disabled={participants.length < 2}
        >
          代表者を選ぶ →
        </Button>
      )}
    </div>
  )
}
