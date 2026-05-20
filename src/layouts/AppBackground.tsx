import { useEffect, useRef } from 'react'

/**
 * 뉴럴 네트워크 스타일 배경 — 떠다니는 노드들이 가까워지면
 * 부드러운 라인으로 연결되며 데이터 흐름을 시각화. AI 대시보드 컨셉.
 */

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
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
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: Node[] = []
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

      // 화면 크기에 비례한 노드 개수 (모바일은 더 적게)
      const area = width * height
      const density = width < 640 ? 22000 : 16000
      const count = Math.min(70, Math.max(24, Math.floor(area / density)))

      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.1 + Math.random() * 1.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.014,
      }))
    }

    const maxDist = 140
    const maxDistSq = maxDist * maxDist

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // 노드 이동 & 갱신
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.pulse += n.pulseSpeed

        if (n.x < -20) n.x = width + 20
        else if (n.x > width + 20) n.x = -20
        if (n.y < -20) n.y = height + 20
        else if (n.y > height + 20) n.y = -20
      }

      // 라인 (가까운 노드들 연결)
      ctx.lineWidth = 0.8
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq < maxDistSq) {
            const alpha = (1 - distSq / maxDistSq) * 0.18
            ctx.strokeStyle = `rgba(49, 130, 246, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // 노드 (펄스 효과)
      for (const n of nodes) {
        const pulseAmt = (Math.sin(n.pulse) + 1) * 0.5 // 0~1
        const glowR = n.r + 2.4 + pulseAmt * 2.2

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR)
        grad.addColorStop(0, `rgba(120, 170, 255, ${0.45 + pulseAmt * 0.25})`)
        grad.addColorStop(0.5, 'rgba(49, 130, 246, 0.18)')
        grad.addColorStop(1, 'rgba(49, 130, 246, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(190, 215, 255, ${0.55 + pulseAmt * 0.3})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    const drawStatic = () => {
      // 모션을 줄이는 환경: 정적인 한 프레임만
      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 0.8
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq < maxDistSq) {
            const alpha = (1 - distSq / maxDistSq) * 0.14
            ctx.strokeStyle = `rgba(49, 130, 246, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(190, 215, 255, 0.55)'
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
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
      {/* base color */}
      <div aria-hidden className="fixed inset-0 -z-30 pointer-events-none bg-[#0B0B10]" />

      {/* faint blue glow top-left for depth */}
      <div
        aria-hidden
        className="fixed -z-20 pointer-events-none"
        style={{
          top: '-200px',
          left: '-180px',
          width: '700px',
          height: '700px',
          background:
            'radial-gradient(circle, rgba(49,130,246,0.10), transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* soft violet glow bottom-right for AI vibe */}
      <div
        aria-hidden
        className="fixed -z-20 pointer-events-none"
        style={{
          bottom: '-240px',
          right: '-200px',
          width: '720px',
          height: '720px',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.10), transparent 65%)',
          filter: 'blur(70px)',
        }}
      />

      {/* neural network canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
      />
    </>
  )
}
