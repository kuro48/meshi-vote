import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Room, Participant } from '@/types/domain'
import { OrderForm } from '@/components/orders/OrderForm'
import { OrderSummary } from '@/components/orders/OrderSummary'
import { Button } from '@/components/ui/Button'
import { getRestaurants } from '@/lib/api/restaurants'
import { getOrders, submitOrder } from '@/lib/api/orders'
import { advancePhase } from '@/lib/api/rooms'
import { useState } from 'react'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
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

  const { data: orderData } = useQuery({
    queryKey: ['orders', room.code],
    queryFn: () => getOrders(room.code),
    staleTime: 1000 * 10,
  })

  const restaurants = restData?.restaurants ?? []
  const orders = orderData?.orders ?? []

  const winner = restaurants.find((r) => r.id === room.winning_restaurant_id)
  const myOrder = orders.find((o) => o.participant_id === currentParticipant?.id)

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

  const allOrdered = participants.length > 0 && participants.every((p) =>
    orders.some((o) => o.participant_id === p.id)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-xs text-amber-400 mb-1">決定したお店</p>
        <h2 className="font-semibold text-xl text-slate-100">{winner?.name ?? '—'}</h2>
        {winner?.external_url && (
          <a
            href={winner.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline mt-1 inline-block"
          >
            注文ページを開く →
          </a>
        )}
      </div>

      {winner && (
        <OrderForm
          restaurantName={winner.name}
          existingOrder={myOrder?.order_text}
          onSubmit={handleSubmitOrder}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-sm font-medium text-slate-300 mb-3">
          みんなの注文 ({orders.length}/{participants.length}人)
        </p>
        <OrderSummary orders={orders} />
      </div>

      {isHost && (
        <Button
          onClick={handleFinish}
          isLoading={isAdvancing}
          disabled={orders.length === 0}
        >
          {allOrdered ? '注文確定！' : `注文をまとめる (${orders.length}人)`}
        </Button>
      )}
    </div>
  )
}
