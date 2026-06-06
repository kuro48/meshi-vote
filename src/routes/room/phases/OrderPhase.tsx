import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Room, Participant, Restaurant } from '@/types/domain'
import { OrderForm } from '@/components/orders/OrderForm'
import { Button } from '@/components/ui/Button'
import { getRestaurants } from '@/lib/api/restaurants'
import { getVotes } from '@/lib/api/votes'
import { getOrders, submitOrder } from '@/lib/api/orders'
import { advancePhase } from '@/lib/api/rooms'
import { useState } from 'react'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

interface GroupData {
  restaurant: Restaurant
  members: Participant[]
  orderedParticipantIds: Set<string>
}

export function OrderPhase({ room, participants, currentParticipant }: Props) {
  const queryClient = useQueryClient()
  const [isAdvancing, setIsAdvancing] = useState(false)
  const isHost = currentParticipant?.role === 'host'

  const { data: restData } = useQuery({
    queryKey: ['restaurants', room.code],
    queryFn: () => getRestaurants(room.code),
    staleTime: 1000 * 60,
  })

  const { data: voteData } = useQuery({
    queryKey: ['votes', room.code],
    queryFn: () => getVotes(room.code),
    staleTime: 1000 * 30,
  })

  const { data: orderData } = useQuery({
    queryKey: ['orders', room.code],
    queryFn: () => getOrders(room.code),
    staleTime: 1000 * 10,
  })

  const restaurants = restData?.restaurants ?? []
  const votes = voteData?.votes ?? []
  const orders = orderData?.orders ?? []

  const myVote = votes.find((v) => v.participant_id === currentParticipant?.id)
  const myRestaurant = restaurants.find((r) => r.id === myVote?.restaurant_id)
  const myOrder = orders.find((o) => o.participant_id === currentParticipant?.id)

  const groups: GroupData[] = restaurants
    .map((restaurant) => {
      const members = participants.filter((p) =>
        votes.some((v) => v.participant_id === p.id && v.restaurant_id === restaurant.id)
      )
      const orderedParticipantIds = new Set(
        orders
          .filter((o) => votes.some((v) => v.participant_id === o.participant_id && v.restaurant_id === restaurant.id))
          .map((o) => o.participant_id)
      )
      return { restaurant, members, orderedParticipantIds }
    })
    .filter((g) => g.members.length > 0)

  const deliveryGroups = groups.filter((g) => g.restaurant.is_delivery)
  const totalDeliveryMembers = deliveryGroups.reduce((acc, g) => acc + g.members.length, 0)
  const totalDeliveryOrdered = deliveryGroups.reduce((acc, g) => acc + g.orderedParticipantIds.size, 0)
  const allDeliveryOrdered = totalDeliveryMembers === 0 || totalDeliveryOrdered === totalDeliveryMembers

  const handleSubmitOrder = async (orderText: string) => {
    await submitOrder(room.code, orderText)
    await queryClient.invalidateQueries({ queryKey: ['orders', room.code] })
  }

  const handleFinish = async () => {
    setIsAdvancing(true)
    try {
      await advancePhase(room.code, 'finished')
      await queryClient.invalidateQueries({ queryKey: ['room', room.code] })
    } finally {
      setIsAdvancing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {myRestaurant && myRestaurant.is_delivery && (
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-xs text-amber-400 mb-1">あなたのグループ</p>
            <h2 className="font-semibold text-lg text-slate-100">{myRestaurant.name}</h2>
            {myRestaurant.external_url && (
              <a
                href={myRestaurant.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:underline mt-1 inline-block"
              >
                注文ページを開く →
              </a>
            )}
          </div>
          <OrderForm
            restaurantName={myRestaurant.name}
            existingOrder={myOrder?.order_text}
            onSubmit={handleSubmitOrder}
          />
        </div>
      )}

      {myRestaurant && !myRestaurant.is_delivery && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-xs text-amber-400 mb-1">あなたのグループ</p>
          <h2 className="font-semibold text-lg text-slate-100">{myRestaurant.name}</h2>
          <p className="text-sm text-slate-400 mt-1">飲食店です — 直接お店へどうぞ</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-300">全グループの状況</p>
        {groups.map(({ restaurant, members, orderedParticipantIds }) => (
          <div key={restaurant.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>{restaurant.is_delivery ? '🛵' : '🍽️'}</span>
                <span className="font-semibold text-slate-100">{restaurant.name}</span>
              </div>
              <span className="text-sm font-bold text-amber-400">{members.length}人</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {members.map((member) => {
                const memberOrder = orders.find((o) => o.participant_id === member.id)
                const hasOrdered = orderedParticipantIds.has(member.id)
                return (
                  <li key={member.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-slate-300 flex-shrink-0">{member.nickname}</span>
                    {restaurant.is_delivery && (
                      <span className={`text-xs text-right ${hasOrdered ? 'text-green-400' : 'text-slate-600'}`}>
                        {hasOrdered ? `✓ ${memberOrder?.order_text ?? ''}` : '未入力'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {isHost && (
        <Button
          onClick={handleFinish}
          isLoading={isAdvancing}
          disabled={groups.length === 0}
        >
          {allDeliveryOrdered
            ? '確定する'
            : `確定する（注文 ${totalDeliveryOrdered}/${totalDeliveryMembers}人）`
          }
        </Button>
      )}
    </div>
  )
}
