// 카카오 지도 JS SDK를 동적으로 1회만 로드한다.
// JS 키는 도메인 제한 키라 클라이언트 노출이 안전(REST 키와 별개).
// 키가 없거나 로드 실패 시 reject → 호출부가 마커 대신 리스트 폴백 UI를 보여준다.

// 우리가 실제로 쓰는 SDK 표면만 좁게 타이핑 (any 회피).
export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}
export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void
}
export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  setBounds(bounds: KakaoLatLngBounds): void
}
export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
}
export interface KakaoPolyline {
  setMap(map: KakaoMap | null): void
}
export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void
}
export interface KakaoMaps {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap; title?: string }) => KakaoMarker
  Polyline: new (options: {
    path: KakaoLatLng[]
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: string
  }) => KakaoPolyline
  CustomOverlay: new (options: {
    position: KakaoLatLng
    content: string | HTMLElement
    map?: KakaoMap
    yAnchor?: number
    xAnchor?: number
    zIndex?: number
  }) => KakaoCustomOverlay
}

interface KakaoNamespace {
  maps: KakaoMaps & { load(callback: () => void): void }
}

declare global {
  interface Window {
    kakao?: KakaoNamespace
  }
}

let cached: Promise<KakaoMaps> | null = null

export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (cached) return cached

  const key = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
  if (!key) {
    return Promise.reject(new Error('kakao-js-key-missing'))
  }

  cached = new Promise<KakaoMaps>((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve(window.kakao.maps)
      return
    }
    const script = document.createElement('script')
    // autoload=false → onload 후 maps.load()로 명시적 초기화(레이스 방지).
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    script.async = true
    script.onload = () => {
      const ns = window.kakao
      if (!ns) {
        reject(new Error('kakao-namespace-missing'))
        return
      }
      ns.maps.load(() => resolve(ns.maps))
    }
    script.onerror = () => {
      cached = null // 일시 실패는 다음 시도에서 재로드 가능하도록
      reject(new Error('kakao-sdk-load-failed'))
    }
    document.head.appendChild(script)
  })

  return cached
}
