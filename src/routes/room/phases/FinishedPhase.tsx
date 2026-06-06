import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Room, Participant } from '@/types/domain'
import { OrderSummary } from '@/components/orders/OrderSummary'
import { Button } from '@/components/ui/Button'
import { getRestaurants } from '@/lib/api/restaurants'
import { getOrders } from '@/lib/api/orders'
import { useSessionStore } from '@/store/sessionStore'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function FinishedPhase({ room }: Props) {
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clearSession)

  const { data: restData } = useQuery({
    queryKey: ['restaurants', room.code],
    queryFn: () => getRestaurants(room.code),
    staleTime: 1000 * 60,
  })

  const { data: orderData } = useQuery({
    queryKey: ['orders', room.code],
    queryFn: () => getOrders(room.code),
    staleTime: 1000 * 60,
  })

  const restaurants = restData?.restaurants ?? []
  const orders = orderData?.orders ?? []
  const winner = restaurants.find((r) => r.id === room.winning_restaurant_id)
  const hasOrders = orders.length > 0

  const handleLeave = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="text-6xl mt-4">🎉</div>

      <div>
        <p className="text-slate-400 text-sm mb-1">今日のご飯は</p>
        <h2 className="font-display text-4xl font-bold text-amber-400">{winner?.name ?? '—'}</h2>
        {winner?.address && (
          <p className="text-slate-400 text-sm mt-1">{winner.address}</p>
        )}
        {winner?.external_url && (
          <a
            href={winner.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-400 hover:underline mt-2 inline-block"
          >
            注文ページを開く →
          </a>
        )}
      </div>

      {hasOrders && (
        <div className="w-full text-left">
          <p className="text-sm font-medium text-slate-300 mb-3">注文一覧</p>
          <OrderSummary orders={orders} />
        </div>
      )}

      <Button onClick={handleLeave} variant="ghost" size="sm">
        ルームを退出
      </Button>
    </div>
  )
}
