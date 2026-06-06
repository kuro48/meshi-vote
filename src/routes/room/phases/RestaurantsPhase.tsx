import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Room, Participant } from '@/types/domain'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { ManualRestaurantForm } from '@/components/restaurants/ManualRestaurantForm'
import { Button } from '@/components/ui/Button'
import { getRestaurants, addRestaurant, deleteRestaurant, type AddRestaurantInput } from '@/lib/api/restaurants'
import { advancePhase } from '@/lib/api/rooms'
import { useState } from 'react'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function RestaurantsPhase({ room, currentParticipant }: Props) {
  const queryClient = useQueryClient()
  const [isAdvancing, setIsAdvancing] = useState(false)

  const isHost = currentParticipant?.role === 'host'
  const isRepresentative = currentParticipant?.role === 'representative'

  const { data } = useQuery({
    queryKey: ['restaurants', room.code],
    queryFn: () => getRestaurants(room.code),
    staleTime: 1000 * 30,
  })

  const restaurants = data?.restaurants ?? []

  const handleAdd = async (input: AddRestaurantInput) => {
    await addRestaurant(room.code, input)
    await queryClient.invalidateQueries({ queryKey: ['restaurants', room.code] })
  }

  const handleDelete = async (restaurantId: string) => {
    await deleteRestaurant(room.code, restaurantId)
    await queryClient.invalidateQueries({ queryKey: ['restaurants', room.code] })
  }

  const handleAdvance = async () => {
    if (restaurants.length === 0) return
    setIsAdvancing(true)
    try {
      await advancePhase(room.code, 'voting')
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsAdvancing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="font-semibold text-slate-100 mb-1">お店を追加</h2>
        <p className="text-sm text-slate-400">
          {isRepresentative
            ? 'あなたはお店を提案できます'
            : isHost
            ? '代表者がお店を入力しています'
            : 'ホストと代表者がお店を入力中です'}
        </p>
      </div>

      {restaurants.length > 0 && (
        <ul className="flex flex-col gap-2">
          {restaurants.map((r) => (
            <li key={r.id}>
              <RestaurantCard
                restaurant={r}
                canDelete={isRepresentative && r.added_by_id === currentParticipant?.id}
                onDelete={() => handleDelete(r.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {isRepresentative && (
        <ManualRestaurantForm onSubmit={handleAdd} />
      )}

      {!isHost && !isRepresentative && restaurants.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-4 animate-pulse">
          代表者がお店を入力中です...
        </p>
      )}

      {isHost && (
        <Button
          onClick={handleAdvance}
          isLoading={isAdvancing}
          disabled={restaurants.length === 0}
        >
          投票を開始 →
        </Button>
      )}
    </div>
  )
}
