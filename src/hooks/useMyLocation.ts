import { useEffect, useState } from 'react'

// 브라우저 Geolocation으로 현재 위치를 1회 조회한다.
// 거부/미지원/실패 시 null을 유지해 호출부가 기본값(서울)으로 폴백하게 한다.
// HTTPS 또는 localhost에서만 동작(브라우저 정책).
export function useMyLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        /* 권한 거부/실패 → null 유지(기본 중심 사용) */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return location
}
