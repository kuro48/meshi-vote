import { useState, useEffect, useMemo } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyRestaurants } from '@/hooks/useNearbyRestaurants'
import { useRestaurantHistory } from '@/hooks/useRestaurantHistory'
import { searchItems } from '@/lib/searchUtils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AddRestaurantInput } from '@/lib/api/restaurants'
import type { PlaceResult } from '@/types/domain'

interface Props {
  onAdd: (data: AddRestaurantInput) => Promise<void>
  addedPlaceIds: Set<string>
}

export function RestaurantPicker({ onAdd, addedPlaceIds }: Props) {
  const [query, setQuery] = useState('')
  const [isDelivery, setIsDelivery] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geo = useGeolocation()
  const { places, isLoading: isSearching, error: searchError, search } = useNearbyRestaurants()
  const { history, addToHistory } = useRestaurantHistory()

  const { request: requestGeo } = geo

  useEffect(() => {
    requestGeo()
  }, [requestGeo])

  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      search(geo.lat, geo.lng)
    }
  }, [geo.lat, geo.lng, search])

  const trimmed = query.trim()

  const nearbyResults = useMemo(
    () => searchItems(places, trimmed, (p) => p.name),
    [places, trimmed]
  )

  const historyResults = useMemo(
    () => (trimmed ? searchItems(history, trimmed, (h) => h.name) : history.slice(0, 5)),
    [history, trimmed]
  )

  const handleAddNearby = async (place: PlaceResult) => {
    setIsAdding(true)
    setError(null)
    try {
      await onAdd({ name: place.name, google_place_id: place.id, is_delivery: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }

  const handleManualAdd = async () => {
    if (!trimmed) return
    setIsAdding(true)
    setError(null)
    try {
      await onAdd({ name: trimmed, is_delivery: isDelivery, external_url: externalUrl.trim() || undefined })
      addToHistory({ name: trimmed })
      setQuery('')
      setIsDelivery(false)
      setExternalUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }

  const isLoadingAny = geo.isLoading || isSearching

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            id="restaurant-query"
            label="お店を検索または入力"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例: ラーメン山田"
          />
        </div>
        <Button
          onClick={() => geo.lat ? search(geo.lat, geo.lng!) : requestGeo()}
          variant="secondary"
          size="sm"
          isLoading={isLoadingAny}
          className="h-11 shrink-0"
        >
          {geo.lat ? '再検索' : '現在地'}
        </Button>
      </div>

      {(geo.error ?? searchError) && (
        <p className="text-xs text-red-400">{geo.error ?? searchError}</p>
      )}

      {nearbyResults.length > 0 && (
        <section>
          <p className="text-xs text-slate-500 mb-2">📍 近くのお店</p>
          <ul className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {nearbyResults.map((place) => {
              const alreadyAdded = addedPlaceIds.has(place.id)
              return (
                <li
                  key={place.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2"
                >
                  <p className="text-sm text-slate-100 truncate flex-1">{place.name}</p>
                  <button
                    onClick={() => handleAddNearby(place)}
                    disabled={alreadyAdded || isAdding}
                    className={`text-xs px-3 py-1 rounded-lg shrink-0 transition-colors ${
                      alreadyAdded
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
        </section>
      )}

      {historyResults.length > 0 && (
        <section>
          <p className="text-xs text-slate-500 mb-2">🕐 履歴</p>
          <ul className="flex flex-col gap-1.5">
            {historyResults.map((entry, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setQuery(entry.name)}
                  className="w-full text-left bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {entry.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trimmed && (
        <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDelivery}
              onChange={(e) => setIsDelivery(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm text-slate-300">🛵 デリバリーで注文する</span>
          </label>

          {isDelivery && (
            <Input
              id="external-url"
              label="注文ページURL（任意）"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={handleManualAdd} isLoading={isAdding}>
            「{trimmed}」を追加
          </Button>
        </div>
      )}
    </div>
  )
}
