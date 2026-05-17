import { useEffect, useState } from 'react'

type Status = 'pending' | 'granted' | 'denied' | 'unsupported'

export interface GeolocationState {
  coords: { lat: number; lon: number } | null
  status: Status
}

const hasGeolocation = () =>
  typeof navigator !== 'undefined' && 'geolocation' in navigator

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(() => ({
    coords: null,
    status: hasGeolocation() ? 'pending' : 'unsupported',
  }))

  useEffect(() => {
    if (!hasGeolocation()) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          status: 'granted',
        })
      },
      () => {
        setState({ coords: null, status: 'denied' })
      },
      { timeout: 8000, maximumAge: 1000 * 60 * 10 }
    )
  }, [])

  return state
}
