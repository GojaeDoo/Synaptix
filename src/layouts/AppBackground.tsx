import { useEffect, useRef, useState } from 'react'

/**
 * 개발자 터미널 스타일 배경 — 코드 스니펫이 한 글자씩 타이핑되며,
 * 다 치면 잠깐 머물렀다가 다음 스니펫으로 교체. 데스크탑에서만 노출.
 */

const SNIPPETS_A = [
  `const widgets = useWidgetStore(\n  (s) => s.visibility\n)`,
  `function Dashboard() {\n  return (\n    <Layout>\n      <WidgetGrid />\n    </Layout>\n  )\n}`,
  `type Layouts = Record<\n  Breakpoint,\n  Layout[]\n>`,
]

const SNIPPETS_B = [
  `const { data } = useQuery({\n  queryKey: ['stocks'],\n  queryFn: fetchStocks,\n})`,
  `async function fetchForecast(city) {\n  const res = await fetch(API_URL)\n  return res.json()\n}`,
  `useEffect(() => {\n  const sub = subscribe()\n  return () => sub.unsubscribe()\n}, [])`,
]

const SNIPPETS_C = [
  `<Route\n  path="/widgets/:id"\n  element={<WidgetDetail />}\n/>`,
  `export const cn = (\n  ...inputs: ClassValue[]\n) => twMerge(clsx(inputs))`,
  `if (!isWeatherConfigured) {\n  return mockWeather\n}`,
]

interface PanelProps {
  snippets: string[]
  startDelay: number
  className?: string
}

function TypingPanel({ snippets, startDelay, className }: PanelProps) {
  const [text, setText] = useState('')
  const stateRef = useRef({ snippetIdx: 0, charIdx: 0, phase: 'typing' as 'typing' | 'pausing' | 'clearing' })

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const tick = () => {
      if (cancelled) return
      const s = stateRef.current
      const snippet = snippets[s.snippetIdx]

      if (s.phase === 'typing') {
        s.charIdx++
        setText(snippet.slice(0, s.charIdx))
        if (s.charIdx >= snippet.length) {
          s.phase = 'pausing'
          timer = window.setTimeout(tick, 2400)
        } else {
          // human-ish jitter
          timer = window.setTimeout(tick, 35 + Math.random() * 40)
        }
      } else if (s.phase === 'pausing') {
        s.phase = 'clearing'
        setText('')
        timer = window.setTimeout(tick, 500)
      } else {
        s.snippetIdx = (s.snippetIdx + 1) % snippets.length
        s.charIdx = 0
        s.phase = 'typing'
        tick()
      }
    }

    timer = window.setTimeout(tick, startDelay)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [snippets, startDelay])

  return (
    <pre
      aria-hidden
      className={`terminal-panel absolute ${className ?? ''}`}
    >
      {text}
      <span className="terminal-cursor">▎</span>
    </pre>
  )
}

export function AppBackground() {
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

      {/* code panels */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <TypingPanel
          snippets={SNIPPETS_A}
          startDelay={400}
          className="top-[88px] left-3 max-w-[200px] sm:top-[110px] sm:left-6 sm:max-w-[320px]"
        />
        <TypingPanel
          snippets={SNIPPETS_B}
          startDelay={2200}
          className="top-[44%] right-3 max-w-[200px] sm:right-6 sm:max-w-[340px]"
        />
        <TypingPanel
          snippets={SNIPPETS_C}
          startDelay={4500}
          className="bottom-[140px] left-6 max-w-[200px] sm:bottom-[120px] sm:left-14 sm:max-w-[320px]"
        />
      </div>
    </>
  )
}
