import type { Restaurant } from '@/types/domain'

interface Props {
  restaurant: Restaurant
  onDelete?: () => void
  canDelete?: boolean
}

export function RestaurantCard({ restaurant, onDelete, canDelete }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
      <div className="text-3xl flex-shrink-0 mt-0.5">
        {restaurant.is_delivery ? '🛵' : '🍽️'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-100 truncate">{restaurant.name}</h3>
          {restaurant.is_delivery && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              デリバリー
            </span>
          )}
        </div>

        {restaurant.address && (
          <p className="text-sm text-slate-400 mt-0.5 truncate">{restaurant.address}</p>
        )}

        {restaurant.external_url && (
          <a
            href={restaurant.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline mt-1 inline-block"
          >
            注文ページを開く →
          </a>
        )}
      </div>

      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          aria-label={`${restaurant.name}を削除`}
        >
          ✕
        </button>
      )}
    </div>
  )
}
