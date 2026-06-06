import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, ArrowUpRight, GitCommitHorizontal } from 'lucide-react'
import { useGithub, type ContributionWeek } from '@/hooks/useGithub'
import { useWidgetStore } from '@/store/widgetStore'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'

// GitHub 잔디 색상 — 앱 테마 블루 스케일
function levelColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.05)'
  if (count <= 2) return 'rgba(49,130,246,0.22)'
  if (count <= 5) return 'rgba(49,130,246,0.48)'
  if (count <= 9) return 'rgba(49,130,246,0.75)'
  return '#3182F6'
}

function calcStreak(weeks: ContributionWeek[]): number {
  const today = new Date().toISOString().slice(0, 10)
  const days = weeks.flatMap((w) => w.contributionDays).sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const d of days) {
    if (d.date > today) continue
    // 오늘 아직 커밋 없으면 건너뜀 (오늘이 0이어도 streak 끊지 않음)
    if (d.date === today && d.contributionCount === 0) continue
    if (d.contributionCount > 0) streak++
    else break
  }
  return streak
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS: [number, string][] = [[1,'M'],[3,'W'],[5,'F']]

const CELL = 10
const GAP = 2
const STRIDE = CELL + GAP
const LEFT = 14 // day label 공간
const TOP = 16  // month label 공간

export function GithubWidget() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useGithub()
  const username = useWidgetStore((s) => s.settings.githubUsername)

  const { weeks, total, streak, monthLabels } = useMemo(() => {
    if (!data) return { weeks: [], total: 0, streak: 0, monthLabels: [] }

    const cal = data.contributionsCollection.contributionCalendar
    const ws = cal.weeks

    const labels: { col: number; label: string }[] = []
    let prevMonth = -1
    ws.forEach((week, col) => {
      const firstDay = week.contributionDays[0]
      if (firstDay) {
        const month = new Date(firstDay.date + 'T00:00:00').getMonth()
        if (month !== prevMonth) {
          if (col > 0) labels.push({ col, label: MONTHS[month] })
          prevMonth = month
        }
      }
    })

    return {
      weeks: ws,
      total: cal.totalContributions,
      streak: calcStreak(ws),
      monthLabels: labels,
    }
  }, [data])

  const svgW = LEFT + 52 * STRIDE - GAP
  const svgH = TOP + 7 * STRIDE - GAP

  const onRefresh = () => qc.invalidateQueries({ queryKey: ['github', username] })
  const openProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://github.com/${username}`, '_blank', 'noopener')
  }

  const notConfigured = error?.message === 'not-configured'

  return (
    <div
      id="widget-github"
      onClick={openProfile}
      className="group/card widget-glass h-full rounded-[8px] relative overflow-hidden cursor-pointer flex flex-col"
      style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitCommitHorizontal size={13} style={{ color: '#3182F6' }} />
          <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#AEAEB2', letterSpacing: '0.06em' }}>GITHUB</span>
          {username && (
            <span style={{ fontSize: '11px', color: '#48484A' }}>@{username}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh() }}
            aria-label="새로고침"
            className="hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 6, borderRadius: 6, display: 'flex' }}
          >
            <RefreshCw size={10} />
          </button>
          <button
            onClick={openProfile}
            aria-label="GitHub 프로필 열기"
            className="hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 6, borderRadius: 6, display: 'flex' }}
          >
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <div style={{ flex: 1, padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 6 }} />
          <div className="skeleton" style={{ flex: 1, borderRadius: 6 }} />
        </div>
      ) : notConfigured ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 24px 24px', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(49,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitCommitHorizontal size={18} style={{ color: '#3182F6' }} />
          </div>
          <p style={{ fontFamily: PIXEL, fontSize: '7px', color: '#3182F6', textAlign: 'center', lineHeight: 2 }}>
            SETUP REQUIRED
          </p>
          <p style={{ fontSize: '12px', color: '#48484A', textAlign: 'center', lineHeight: 1.7 }}>
            Vercel 환경 변수에<br /><code style={{ color: '#636366', fontSize: '11px' }}>GITHUB_TOKEN</code>을 추가해주세요
          </p>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px 18px' }}>
          <p style={{ fontSize: '12px', color: '#636366', textAlign: 'center' }}>{error.message}</p>
        </div>
      ) : data ? (
        <>
          {/* 통계 */}
          <div style={{ display: 'flex', gap: 20, padding: '0 18px 12px' }}>
            <div>
              <p style={{ fontFamily: PIXEL, fontSize: '7px', color: '#636366', marginBottom: 5, letterSpacing: '0.04em' }}>CONTRIBUTIONS</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#F2F2F7', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {total.toLocaleString()}
              </p>
            </div>
            {streak > 0 && (
              <div>
                <p style={{ fontFamily: PIXEL, fontSize: '7px', color: '#636366', marginBottom: 5, letterSpacing: '0.04em' }}>STREAK</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#3182F6', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {streak}일
                </p>
              </div>
            )}
          </div>

          {/* 잔디 그리드 */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '0 18px 16px', minHeight: 0, display: 'flex', alignItems: 'center' }}>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              aria-label="GitHub 기여 그래프"
            >
              {/* 월 레이블 */}
              {monthLabels.map(({ col, label }) => (
                <text
                  key={`m-${col}`}
                  x={LEFT + col * STRIDE}
                  y={10}
                  fill="#48484A"
                  fontSize={8}
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              ))}

              {/* 요일 레이블 */}
              {DAY_LABELS.map(([row, label]) => (
                <text
                  key={`d-${row}`}
                  x={0}
                  y={TOP + row * STRIDE + CELL - 1}
                  fill="#3A3A3C"
                  fontSize={8}
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              ))}

              {/* 기여 셀 */}
              {weeks.map((week, col) =>
                week.contributionDays.map((day) => (
                  <rect
                    key={day.date}
                    x={LEFT + col * STRIDE}
                    y={TOP + day.weekday * STRIDE}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={levelColor(day.contributionCount)}
                  >
                    <title>{day.date}: {day.contributionCount}회 기여</title>
                  </rect>
                ))
              )}
            </svg>
          </div>
        </>
      ) : null}
    </div>
  )
}
