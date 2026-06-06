import { useEffect } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyRestaurants } from '@/hooks/useNearbyRestaurants'
import { Button } from '@/components/ui/Button'
import type { AddRestaurantInput } from '@/lib/api/restaurants'

interface Props {
  onAdd: (data: AddRestaurantInput) => Promise<void>
  addedPlaceIds: Set<string>
}

export function NearbyRestaurantSearch({ onAdd, addedPlaceIds }: Props) {
  const geo = useGeolocation()
  const { places, isLoading: isSearching, error: searchError, search } = useNearbyRestaurants()

  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      search(geo.lat, geo.lng)
    }
  }, [geo.lat, geo.lng, search])

  const isLoadingAny = geo.isLoading || isSearching

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300">📍 近くのお店を探す</p>
        <Button
          onClick={() => geo.lat ? search(geo.lat, geo.lng!) : geo.request()}
          variant="secondary"
          size="sm"
          isLoading={isLoadingAny}
        >
          {geo.lat ? '再検索' : '現在地を取得'}
        </Button>
      </div>

      {(geo.error ?? searchError) && (
        <p className="text-xs text-red-400">{geo.error ?? searchError}</p>
      )}

      {places.length === 0 && geo.lat && !isLoadingAny && !searchError && (
        <p className="text-xs text-slate-500 text-center py-2">近くにお店が見つかりませんでした</p>
      )}

      {places.length > 0 && (
        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {places.map((place) => {
            const alreadyAdded = addedPlaceIds.has(place.id)
            return (
              <li
                key={place.id}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{place.name}</p>
                  {place.address && (
                    <p className="text-xs text-slate-500 truncate">{place.address}</p>
                  )}
                </div>
                <button
                  onClick={() =>
                    onAdd({
                      name: place.name,
                      address: place.address,
                      google_place_id: place.id,
                      is_delivery: false,
                    })
                  }
                  disabled={alreadyAdded}
                  className={`text-xs px-3 py-1 rounded-lg flex-shrink-0 transition-colors
                    ${alreadyAdded
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-medium'
                    }`}
                >
                  {alreadyAdded ? '追加済み' : '追加'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
