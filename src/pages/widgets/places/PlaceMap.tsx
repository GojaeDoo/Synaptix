import { useEffect, useRef, useState } from 'react'
import { MapPinned } from 'lucide-react'
import {
  loadKakaoMaps,
  type KakaoMap,
  type KakaoMarker,
  type KakaoPolyline,
  type KakaoCustomOverlay,
} from '@/lib/kakaoLoader'
import { ACCENT, BORDER } from './constants'

// 서울시청 — 검색 전/좌표 없을 때의 기본 중심.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export interface MapPoint {
  lat: number
  lng: number
  name: string
}

interface Props {
  points: MapPoint[]
  // true면 번호 마커 + 순서대로 선을 그려 동선(코스 로드맵)을 표현.
  ordered?: boolean
  focus?: { lat: number; lng: number } | null
  // 검색 결과가 없을 때 지도 기본 중심을 사용자 현재 위치로.
  myLocation?: { lat: number; lng: number } | null
}

function numberedPin(n: number): string {
  return (
    `<div style="transform:translateY(-50%);display:flex;align-items:center;justify-content:center;` +
    `width:24px;height:24px;border-radius:50%;background:${ACCENT};color:#0F0F0F;` +
    `font-size:12px;font-weight:800;border:2px solid #0F0F0F;box-shadow:0 1px 4px rgba(0,0,0,0.5)">${n}</div>`
  )
}

function myLocationDot(): string {
  return (
    `<div style="width:14px;height:14px;border-radius:50%;background:#3182F6;` +
    `border:2px solid #fff;box-shadow:0 0 0 4px rgba(49,130,246,0.3)"></div>`
  )
}

export function PlaceMap({ points, ordered = false, focus, myLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const markersRef = useRef<KakaoMarker[]>([])
  const overlaysRef = useRef<KakaoCustomOverlay[]>([])
  const polylineRef = useRef<KakaoPolyline | null>(null)
  const myDotRef = useRef<KakaoCustomOverlay | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  // SDK 로드 + 지도 1회 생성
  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
        })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // points가 바뀌면 마커/선을 다시 그리고 bounds를 맞춘다.
  useEffect(() => {
    const map = mapRef.current
    const maps = window.kakao?.maps
    if (!map || !maps || status !== 'ready') return

    markersRef.current.forEach((m) => m.setMap(null))
    overlaysRef.current.forEach((o) => o.setMap(null))
    polylineRef.current?.setMap(null)
    markersRef.current = []
    overlaysRef.current = []
    polylineRef.current = null
    if (points.length === 0) return

    const bounds = new maps.LatLngBounds()
    const path = points.map((p) => new maps.LatLng(p.lat, p.lng))
    path.forEach((pos) => bounds.extend(pos))

    if (ordered) {
      // 번호 마커 + 순서대로 잇는 선 → 동선(로드맵)
      points.forEach((_, i) => {
        overlaysRef.current.push(
          new maps.CustomOverlay({ position: path[i], content: numberedPin(i + 1), yAnchor: 0.5, zIndex: 3 }),
        )
      })
      overlaysRef.current.forEach((o) => o.setMap(map))
      if (path.length >= 2) {
        polylineRef.current = new maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: ACCENT,
          strokeOpacity: 0.85,
          strokeStyle: 'solid',
        })
        polylineRef.current.setMap(map)
      }
    } else {
      points.forEach((p, i) => {
        markersRef.current.push(new maps.Marker({ position: path[i], map, title: p.name }))
      })
    }

    map.setBounds(bounds)
  }, [points, ordered, status])

  // 검색 결과가 없을 때 내 위치로 지도 중심을 잡고 "내 위치" 점을 표시.
  // 결과가 생기면(points>0) 위 effect의 setBounds가 우선하고 점은 숨긴다.
  useEffect(() => {
    const map = mapRef.current
    const maps = window.kakao?.maps
    if (!map || !maps || status !== 'ready') return
    myDotRef.current?.setMap(null)
    myDotRef.current = null
    if (myLocation && points.length === 0) {
      const pos = new maps.LatLng(myLocation.lat, myLocation.lng)
      map.setCenter(pos)
      map.setLevel(5)
      myDotRef.current = new maps.CustomOverlay({ position: pos, content: myLocationDot(), yAnchor: 0.5, zIndex: 2 })
      myDotRef.current.setMap(map)
    }
  }, [myLocation, points.length, status])

  // 리스트에서 특정 장소를 선택하면 그 좌표로 이동.
  useEffect(() => {
    const map = mapRef.current
    const maps = window.kakao?.maps
    if (!map || !maps || status !== 'ready' || !focus) return
    map.setCenter(new maps.LatLng(focus.lat, focus.lng))
    map.setLevel(3)
  }, [focus, status])

  if (status === 'unavailable') {
    return (
      <div
        className="h-full w-full rounded-2xl flex flex-col items-center justify-center text-center gap-2 px-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}
      >
        <MapPinned size={28} className="text-[#48484A]" />
        <p className="text-[13px] text-[#8E8E93]">지도를 표시할 수 없어요</p>
        <p className="text-[11.5px] text-[#636366] leading-relaxed max-w-[220px]">
          <code className="text-[#AEAEB2]">VITE_KAKAO_JS_KEY</code>가 설정되면 지도가 나타납니다. 검색·일정·코스는 아래 목록으로 계속 사용할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
          <div className="w-5 h-5 rounded-full border-2 border-[#00C896] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}
