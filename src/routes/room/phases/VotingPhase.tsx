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
  const totalVotes = votes.length

  const myVote = votes.find((v) => v.participant_id === currentParticipant?.id)

  const votesPerRestaurant = Object.fromEntries(
    restaurants.map((r) => [r.id, votes.filter((v) => v.restaurant_id === r.id).length])
  )

  const handleVote = async (restaurantId: string) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await castVote(room.code, restaurantId)
      await queryClient.invalidateQueries({ queryKey: ['votes', room.code] })
    } finally {
      setIsVoting(false)
    }
  }

  const handleAdvance = async () => {
    const winnerEntry = Object.entries(votesPerRestaurant).sort(([, a], [, b]) => b - a)[0]
    const winnerId = winnerEntry?.[0]
    const hasDelivery = restaurants.find((r) => r.id === winnerId)?.is_delivery
    const nextPhase = hasDelivery ? 'order' : 'finished'
    setIsAdvancing(true)
    try {
      await advancePhase(room.code, nextPhase, winnerId)
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsAdvancing(false)
    }
  }

  const allVoted = participants.length > 0 && participants.every((p) =>
    votes.some((v) => v.participant_id === p.id)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-semibold text-slate-100 mb-1">どこに行く？</h2>
        <p className="text-sm text-slate-400">
          {myVote ? '投票済みです（変更可能）' : 'お店を選んでください'}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {restaurants.map((r) => (
          <li key={r.id}>
            <VoteBallot
              restaurant={r}
              voteCount={votesPerRestaurant[r.id] ?? 0}
              totalVotes={totalVotes}
              isSelected={myVote?.restaurant_id === r.id}
              onVote={handleVote}
              isDisabled={isVoting}
            />
          </li>
        ))}
      </ul>

      <p className="text-xs text-center text-slate-500">
        投票済み {votes.length} / {participants.length}人
      </p>

      {isHost && (
        <Button
          onClick={handleAdvance}
          isLoading={isAdvancing}
          disabled={totalVotes === 0}
        >
          {allVoted ? '結果を確定 →' : `結果を確定 (${votes.length}票)`}
        </Button>
      )}
    </div>
  )
}
