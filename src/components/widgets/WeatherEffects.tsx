import { useMemo } from 'react'
import type { WeatherEffect } from '@/lib/weatherEffect'

export function WeatherEffects({ effect, isNight }: { effect: WeatherEffect; isNight: boolean }) {
  return (
    <>
      {isNight ? <NightOverlay /> : <DayOverlay />}
      {effect === 'rain' && <RainEffect />}
      {effect === 'snow' && <SnowEffect />}
      {effect === 'hot' && <HotEffect />}
      {effect === 'freeze' && <FreezeEffect />}
    </>
  )
}

function RainEffect() {
  const drops = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 6.7 + 3) % 100}%`,
        delay: `${(i * 0.11) % 1.2}s`,
        duration: `${0.55 + ((i * 0.07) % 0.45)}s`,
      })),
    []
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {drops.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.left,
            top: 0,
            width: '2px',
            height: '10px',
            background: '#9bc7e8',
            imageRendering: 'pixelated',
            animation: `weather-rain ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

function SnowEffect() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: `${(i * 5.3 + 2) % 100}%`,
        delay: `${(i * 0.31) % 4}s`,
        duration: `${4 + ((i * 0.5) % 3)}s`,
        size: i % 4 === 0 ? 4 : 3,
      })),
    []
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {flakes.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: f.left,
            top: 0,
            width: `${f.size}px`,
            height: `${f.size}px`,
            background: 'white',
            imageRendering: 'pixelated',
            animation: `weather-snow ${f.duration} linear ${f.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

function HotEffect() {
  const heat = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: `${(i * 11 + 5) % 100}%`,
        delay: `${(i * 0.37) % 2.8}s`,
        duration: `${2.4 + ((i * 0.31) % 1.6)}s`,
        color: i % 2 === 0 ? '#ff8a4c' : '#ffb86c',
      })),
    []
  )
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(255, 95, 40, 0.28), transparent 65%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {heat.map((h, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: h.left,
              bottom: '-4px',
              width: '3px',
              height: '3px',
              background: h.color,
              imageRendering: 'pixelated',
              animation: `weather-heat ${h.duration} ease-in ${h.delay} infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

function DayOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(120, 175, 220, 0.20) 0%, rgba(120, 175, 220, 0.06) 35%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 88% 12%, rgba(255, 210, 130, 0.22), transparent 32%)',
        }}
      />
      <PixelSun style={{ top: 10, right: 10, width: 22, height: 22, opacity: 0.72 }} />
    </>
  )
}

function NightOverlay() {
  const stars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 7.3 + 4) % 100}%`,
        top: `${(i * 5.7 + 5) % 55}%`,
        delay: `${(i * 0.41) % 3}s`,
        size: i % 5 === 0 ? 2 : 1,
      })),
    []
  )
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(70, 95, 160, 0.22), transparent 70%)',
        }}
      />
      <PixelMoon style={{ top: 8, right: 10, width: 20, height: 20, opacity: 0.7 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((s, i) => (
          <div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: '#e8edff',
              animation: `weather-twinkle 2.6s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

function FreezeEffect() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${(i * 9.7 + 4) % 100}%`,
        top: `${(i * 8.3 + 8) % 75}%`,
        delay: `${(i * 0.27) % 3}s`,
      })),
    []
  )
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 35%, rgba(130, 200, 255, 0.22) 100%)',
        }}
      />
      <PixelCrystal style={{ top: 6,    left: 6,   width: 18, height: 18, opacity: 0.55 }} />
      <PixelCrystal style={{ top: 10,   right: 8,  width: 14, height: 14, opacity: 0.4  }} />
      <PixelCrystal style={{ bottom: 60, left: 14, width: 12, height: 12, opacity: 0.35 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sparkles.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              width: '2px',
              height: '2px',
              background: '#bce5ff',
              animation: `weather-twinkle 2.5s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

function PixelSun({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 22 22"
      style={{ position: 'absolute', imageRendering: 'pixelated', pointerEvents: 'none', ...style }}
    >
      <rect x="8"  y="6"  width="6" height="10" fill="#ffb74d" />
      <rect x="6"  y="8"  width="10" height="6" fill="#ffb74d" />
      <rect x="9"  y="0"  width="4" height="3" fill="#ffb74d" />
      <rect x="9"  y="19" width="4" height="3" fill="#ffb74d" />
      <rect x="0"  y="9"  width="3" height="4" fill="#ffb74d" />
      <rect x="19" y="9"  width="3" height="4" fill="#ffb74d" />
      <rect x="2"  y="2"  width="3" height="3" fill="#ffb74d" />
      <rect x="17" y="2"  width="3" height="3" fill="#ffb74d" />
      <rect x="2"  y="17" width="3" height="3" fill="#ffb74d" />
      <rect x="17" y="17" width="3" height="3" fill="#ffb74d" />
    </svg>
  )
}

function PixelMoon({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      style={{ position: 'absolute', imageRendering: 'pixelated', pointerEvents: 'none', ...style }}
    >
      <rect x="6"  y="2"  width="8"  height="2" fill="#f5f0d4" />
      <rect x="4"  y="4"  width="9"  height="2" fill="#f5f0d4" />
      <rect x="3"  y="6"  width="7"  height="2" fill="#f5f0d4" />
      <rect x="3"  y="8"  width="6"  height="2" fill="#f5f0d4" />
      <rect x="3"  y="10" width="6"  height="2" fill="#f5f0d4" />
      <rect x="3"  y="12" width="7"  height="2" fill="#f5f0d4" />
      <rect x="4"  y="14" width="9"  height="2" fill="#f5f0d4" />
      <rect x="6"  y="16" width="8"  height="2" fill="#f5f0d4" />
    </svg>
  )
}

function PixelCrystal({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 16 16"
      style={{ position: 'absolute', imageRendering: 'pixelated', pointerEvents: 'none', ...style }}
    >
      <rect x="7" y="0"  width="2"  height="16" fill="#bce5ff" />
      <rect x="0" y="7"  width="16" height="2"  fill="#bce5ff" />
      <rect x="3" y="3"  width="2"  height="2"  fill="#bce5ff" />
      <rect x="11" y="3" width="2"  height="2"  fill="#bce5ff" />
      <rect x="3" y="11" width="2"  height="2"  fill="#bce5ff" />
      <rect x="11" y="11" width="2" height="2"  fill="#bce5ff" />
    </svg>
  )
}
