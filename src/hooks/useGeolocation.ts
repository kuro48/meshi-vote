import { useState, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  error: string | null
  isLoading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    isLoading: false,
  })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: '位置情報が利用できません' }))
      return
    }

    setState((s) => ({ ...s, isLoading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          isLoading: false,
        })
      },
      () => {
        setState({ lat: null, lng: null, error: '位置情報の取得に失敗しました', isLoading: false })
      },
      { timeout: 10000 }
    )
  }, [])

  return { ...state, request }
}
