import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Room, Participant } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { getRestaurants } from '@/lib/api/restaurants'
import { getVotes } from '@/lib/api/votes'
import { getOrders } from '@/lib/api/orders'
import { useSessionStore } from '@/store/sessionStore'

interface Props {
  room: Room
  participants: Participant[]
  currentParticipant: Participant | null
}

export function FinishedPhase({ room, participants }: Props) {
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clearSession)

  const { data: restData } = useQuery({
    queryKey: ['restaurants', room.code],
    queryFn: () => getRestaurants(room.code),
    staleTime: 1000 * 60,
  })

  const { data: voteData } = useQuery({
    queryKey: ['votes', room.code],
    queryFn: () => getVotes(room.code),
    staleTime: 1000 * 60,
  })

  const { data: orderData } = useQuery({
    queryKey: ['orders', room.code],
    queryFn: () => getOrders(room.code),
    staleTime: 1000 * 60,
  })

  const restaurants = restData?.restaurants ?? []
  const votes = voteData?.votes ?? []
  const orders = orderData?.orders ?? []

  const groups = restaurants
    .map((restaurant) => {
      const members = participants.filter((p) =>
        votes.some((v) => v.participant_id === p.id && v.restaurant_id === restaurant.id)
      )
      const groupOrders = orders.filter((o) =>
        votes.some((v) => v.participant_id === o.participant_id && v.restaurant_id === restaurant.id)
      )
      return { restaurant, members, orders: groupOrders }
    })
    .filter((g) => g.members.length > 0)
    .sort((a, b) => b.members.length - a.members.length)

  const handleLeave = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-2">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-slate-400 text-sm">グループ確定！</p>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map(({ restaurant, members, orders: groupOrders }) => (
          <div key={restaurant.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{restaurant.is_delivery ? '🛵' : '🍽️'}</span>
                <div>
                  <p className="font-semibold text-slate-100">{restaurant.name}</p>
                  {restaurant.address && (
                    <p className="text-xs text-slate-500">{restaurant.address}</p>
                  )}
                </div>
              </div>
              <span className="text-lg font-bold text-amber-400">{members.length}人</span>
            </div>

            {restaurant.external_url && (
              <a
                href={restaurant.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:underline mb-3 inline-block"
              >
                注文ページを開く →
              </a>
            )}

            {restaurant.is_delivery && groupOrders.length > 0 ? (
              <ul className="flex flex-col gap-2 border-t border-slate-800 pt-3 mt-1">
                {groupOrders.map((order) => (
                  <li key={order.id} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-amber-400">
                      {order.participants?.nickname ?? '不明'}
                    </span>
                    <p className="text-sm text-slate-100 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 whitespace-pre-wrap">
                      {order.order_text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-3 mt-1">
                {members.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300"
                  >
                    {m.nickname}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleLeave} variant="ghost" size="sm">
        ルームを退出
      </Button>
    </div>
  )
}
