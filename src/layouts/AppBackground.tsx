import { useEffect, useRef } from 'react'

// A: 작은 픽셀 사각형들이 천천히 떠다님
// D: CRT 스캔라인이 위→아래로 흘러감

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  pulse: number
  pulseSpeed: number
}

export function AppBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let rafId = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = width < 640 ? 28 : 52
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: [2, 2, 2, 3, 3, 4, 4, 6, 6, 8][Math.floor(Math.random() * 10)],
        opacity: 0.12 + Math.random() * 0.22,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.009,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        if (p.x < -8) p.x = width + 8
        else if (p.x > width + 8) p.x = -8
        if (p.y < -8) p.y = height + 8
        else if (p.y > height + 8) p.y = -8

        const pulseAmt = (Math.sin(p.pulse) + 1) * 0.5
        const alpha = p.opacity * (0.55 + pulseAmt * 0.45)

        ctx.fillStyle = `rgba(210, 220, 255, ${alpha})`
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
      }

      rafId = requestAnimationFrame(draw)
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        ctx.fillStyle = `rgba(210, 220, 255, ${p.opacity})`
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
      }
    }

    resize()
    if (prefersReducedMotion) {
      drawStatic()
    } else {
      draw()
    }

    const onResize = () => {
      resize()
      if (prefersReducedMotion) drawStatic()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* 베이스 배경 */}
      <div aria-hidden className="fixed inset-0 -z-30 pointer-events-none bg-[#0B0B10]" />

      {/* 블루 글로우 좌상단 */}
      <div
        aria-hidden
        className="fixed -z-20 pointer-events-none"
        style={{
          top: '-180px', left: '-160px',
          width: '580px', height: '580px',
          background: 'radial-gradient(circle, rgba(49,130,246,0.07), transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* 바이올렛 글로우 우하단 */}
      <div
        aria-hidden
        className="fixed -z-20 pointer-events-none"
        style={{
          bottom: '-220px', right: '-180px',
          width: '580px', height: '580px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07), transparent 65%)',
          filter: 'blur(70px)',
        }}
      />

      {/* 픽셀 파티클 캔버스 */}
      <canvas ref={canvasRef} aria-hidden className="fixed inset-0 -z-10 pointer-events-none" />

      {/* CRT 스캔라인 */}
      <div
        aria-hidden
        className="fixed inset-x-0 -z-10 pointer-events-none"
        style={{
          height: 140,
          top: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(180,200,255,0.028) 50%, transparent 100%)',
          animation: 'crt-scanline 11s linear infinite',
        }}
      />
    </>
  )
}
