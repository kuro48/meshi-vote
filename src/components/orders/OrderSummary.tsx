import type { Order } from '@/types/domain'

interface Props {
  orders: Order[]
}

export function OrderSummary({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <p className="text-center text-slate-500 py-6 text-sm">まだ注文がありません</p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {orders.map((order) => (
        <li key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-semibold text-amber-400 flex-shrink-0">
              {order.participants?.nickname ?? '不明'}
            </span>
            <p className="text-sm text-slate-200 text-right whitespace-pre-wrap">{order.order_text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
