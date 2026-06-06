import type { Restaurant } from '@/types/domain'

interface Props {
  restaurant: Restaurant
  voteCount: number
  totalVotes: number
  isSelected: boolean
  onVote: (restaurantId: string) => void
  isDisabled?: boolean
}

export function VoteBallot({ restaurant, voteCount, totalVotes, isSelected, onVote, isDisabled }: Props) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

  return (
    <button
      onClick={() => onVote(restaurant.id)}
      disabled={isDisabled}
      className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
        ${isSelected
          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
          : 'border-slate-800 bg-slate-900 hover:border-slate-600'
        }
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{restaurant.is_delivery ? '🛵' : '🍽️'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-100 truncate">{restaurant.name}</span>
            <span className={`text-sm font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
              {voteCount}票
            </span>
          </div>

          {restaurant.address && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{restaurant.address}</p>
          )}

          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-amber-500' : 'bg-slate-600'}`}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
    </button>
  )
}
