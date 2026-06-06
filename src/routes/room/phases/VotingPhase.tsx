import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Room, Participant } from '@/types/domain'
import { VoteBallot } from '@/components/voting/VoteBallot'
import { Button } from '@/components/ui/Button'
import { getRestaurants } from '@/lib/api/restaurants'
import { getVotes, castVote } from '@/lib/api/votes'
import { advancePhase } from '@/lib/api/rooms'
import { useState } from 'react'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function VotingPhase({ room, participants, currentParticipant }: Props) {
  const queryClient = useQueryClient()
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const isHost = currentParticipant?.role === 'host'

  const { data: restData } = useQuery({
    queryKey: ['restaurants', room.code],
    queryFn: () => getRestaurants(room.code),
    staleTime: 1000 * 30,
  })

  const { data: voteData } = useQuery({
    queryKey: ['votes', room.code],
    queryFn: () => getVotes(room.code),
    staleTime: 1000 * 10,
  })

  const restaurants = restData?.restaurants ?? []
  const votes = voteData?.votes ?? []

  const myVote = votes.find((v) => v.participant_id === currentParticipant?.id)

  const participantCountPerRestaurant = Object.fromEntries(
    restaurants.map((r) => [r.id, votes.filter((v) => v.restaurant_id === r.id).length])
  )

  const handleJoin = async (restaurantId: string) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await castVote(room.code, restaurantId)
      await queryClient.invalidateQueries({ queryKey: ['votes', room.code] })
    } finally {
      setIsVoting(false)
    }
  }

  const handleConfirm = async () => {
    const activeRestaurantIds = new Set(votes.map((v) => v.restaurant_id))
    const hasDeliveryGroup = restaurants.some(
      (r) => r.is_delivery && activeRestaurantIds.has(r.id)
    )
    const nextPhase = hasDeliveryGroup ? 'order' : 'finished'
    setIsAdvancing(true)
    try {
      await advancePhase(room.code, nextPhase)
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsAdvancing(false)
    }
  }

  const joinedCount = votes.length

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-semibold text-slate-100 mb-1">参加するお店を選ぼう</h2>
        <p className="text-sm text-slate-400">
          {myVote ? '参加済みです（変更可能）' : 'どのグループに入りますか？'}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {restaurants.map((r) => (
          <li key={r.id}>
            <VoteBallot
              restaurant={r}
              voteCount={participantCountPerRestaurant[r.id] ?? 0}
              totalVotes={joinedCount}
              isSelected={myVote?.restaurant_id === r.id}
              onVote={handleJoin}
              isDisabled={isVoting}
            />
          </li>
        ))}
      </ul>

      <p className="text-xs text-center text-slate-500">
        参加済み {joinedCount} / {participants.length}人
      </p>

      {isHost && (
        <Button
          onClick={handleConfirm}
          isLoading={isAdvancing}
          disabled={joinedCount === 0}
        >
          グループを確定する ({joinedCount}人参加済み)
        </Button>
      )}
    </div>
  )
}
