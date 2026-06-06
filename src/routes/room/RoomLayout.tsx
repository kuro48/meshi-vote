import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomQuery } from '@/hooks/useRoom'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useParticipant } from '@/hooks/useParticipant'
import { useSessionStore } from '@/store/sessionStore'
import { PhaseStepper } from '@/components/room/PhaseStepper'
import { ParticipantList } from '@/components/room/ParticipantList'
import { WaitingPhase } from './phases/WaitingPhase'
import { RepresentativesPhase } from './phases/RepresentativesPhase'
import { RestaurantsPhase } from './phases/RestaurantsPhase'
import { VotingPhase } from './phases/VotingPhase'
import { OrderPhase } from './phases/OrderPhase'
import { FinishedPhase } from './phases/FinishedPhase'

export function RoomLayout() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const sessionRoomCode = useSessionStore((s) => s.roomCode)
  const participantId = useSessionStore((s) => s.participantId)

  const { data, isLoading, isError } = useRoomQuery()
  const currentParticipant = useParticipant()

  useRoomRealtime(data?.room.code ?? null, data?.room.id ?? null)

  useEffect(() => {
    if (!participantId) {
      navigate('/', { replace: true })
    }
  }, [participantId, navigate])

  useEffect(() => {
    if (sessionRoomCode && code && sessionRoomCode !== code.toUpperCase()) {
      navigate('/', { replace: true })
    }
  }, [sessionRoomCode, code, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">読み込み中...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-300">ルームが見つかりませんでした</p>
        <button onClick={() => navigate('/')} className="text-amber-400 hover:underline text-sm">
          トップに戻る
        </button>
      </div>
    )
  }

  const { room, participants } = data

  const phaseComponent = (() => {
    switch (room.phase) {
      case 'waiting': return <WaitingPhase room={room} participants={participants} currentParticipant={currentParticipant} />
      case 'representatives': return <RepresentativesPhase room={room} participants={participants} currentParticipant={currentParticipant} />
      case 'restaurants': return <RestaurantsPhase room={room} participants={participants} currentParticipant={currentParticipant} />
      case 'voting': return <VotingPhase room={room} participants={participants} currentParticipant={currentParticipant} />
      case 'order': return <OrderPhase room={room} participants={participants} currentParticipant={currentParticipant} />
      case 'finished': return <FinishedPhase room={room} participants={participants} currentParticipant={currentParticipant} />
    }
  })()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl text-amber-400">meshi-vote</span>
            <span className="text-xs text-slate-500 font-mono">{room.code}</span>
          </div>
          <PhaseStepper phase={room.phase} />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <ParticipantList participants={participants} currentParticipantId={participantId} />
        {phaseComponent}
      </main>
    </div>
  )
}
