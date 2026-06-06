import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Room, Participant } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { setRepresentatives, advancePhase } from '@/lib/api/rooms'

const MIN_REPS = 2
const MAX_REPS = 3

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function RepresentativesPhase({ room, participants, currentParticipant }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const isHost = currentParticipant?.role === 'host'

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_REPS) {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = async () => {
    if (selected.size < MIN_REPS) return
    setIsLoading(true)
    try {
      // ホスト自身は role を変えずにお店追加権限を持つため送信から除外
      const hostId = currentParticipant?.id
      const nonHostSelected = Array.from(selected).filter((id) => id !== hostId)
      await setRepresentatives(room.code, nonHostSelected)
      await advancePhase(room.code, 'restaurants')
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-semibold text-slate-100 mb-1">代表者を選んでください</h2>
        <p className="text-sm text-slate-400">{MIN_REPS}〜{MAX_REPS}人を選んでお店を提案してもらいます</p>
      </div>

      {isHost ? (
        <>
          {participants.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">参加者がいません</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {participants.map((p) => {
                const isSelected = selected.has(p.id)
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => toggle(p.id)}
                      className={`w-full text-left rounded-2xl border px-4 py-3 flex items-center justify-between transition-all active:scale-[0.98]
                        ${isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                        }`}
                    >
                      <span className="text-slate-100 font-medium">{p.nickname}</span>
                      {isSelected && <span className="text-amber-400 text-sm">⭐ 代表</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={selected.size < MIN_REPS}
          >
            代表者を確定 ({selected.size}/{MAX_REPS})
          </Button>
        </>
      ) : (
        <p className="text-center text-slate-400 text-sm py-4 animate-pulse">
          ホストが代表者を選んでいます...
        </p>
      )}
    </div>
  )
}
