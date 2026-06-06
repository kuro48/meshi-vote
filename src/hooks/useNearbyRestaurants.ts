import { useState, useCallback } from 'react'
import type { PlaceResult } from '@/types/domain'

export function useNearbyRestaurants() {
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (lat: number, lng: number, radius = 1000) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
      })
      const res = await fetch(`/api/places/nearby?${params}`)
      const data = await res.json() as { places: PlaceResult[] }
      setPlaces(data.places ?? [])
    } catch {
      setError('近くのお店を取得できませんでした')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { places, isLoading, error, search }
}
