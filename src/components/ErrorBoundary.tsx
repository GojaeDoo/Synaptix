import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  /** 디버깅 로그에 찍을 식별자 (예: 'weather' 위젯) */
  name?: string
  /** 위젯 카드 모양의 폴백을 쓸지, 페이지 전체 폴백을 쓸지 */
  variant?: 'widget' | 'page'
  children: ReactNode
}

interface State {
  error: Error | null
}

// React 19까지도 error boundary는 클래스 컴포넌트로만 만들 수 있다.
// 위젯 하나가 throw해도 다른 위젯은 살아남도록 격리하는 역할.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.variant === 'page') {
      return <PageFallback onReset={this.reset} />
    }
    return <WidgetFallback onReset={this.reset} />
  }
}

function WidgetFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="widget-glass h-full rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center bg-[rgba(38,38,38,0.72)] backdrop-blur-xl border border-down/15">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-down/10">
        <AlertTriangle size={18} className="text-down" aria-hidden="true" />
      </div>
      <p className="text-[13px] text-t1 font-medium">위젯을 불러올 수 없어요</p>
      <p className="text-[11px] text-t3 leading-relaxed">잠시 후 다시 시도해보세요.</p>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-accent bg-accent/10 border border-accent/30 hover:bg-accent/[0.18] transition-colors cursor-pointer"
      >
        <RefreshCw size={11} aria-hidden="true" />
        다시 시도
      </button>
    </div>
  )
}

function PageFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-3xl relative overflow-hidden bg-card border border-white/[0.07] px-7 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-down/60 to-transparent"
        />

        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-down/10">
            <AlertTriangle size={22} className="text-down" aria-hidden="true" />
          </div>
          <p className="text-[16px] text-t1 font-semibold">
            예기치 못한 오류가 발생했어요
          </p>
        </div>

        <p className="text-center text-[13px] text-t3 mb-7 leading-relaxed">
          잠시 후 다시 시도해주세요.<br />
          문제가 계속되면 새로고침을 해보세요.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-medium text-t1 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} aria-hidden="true" />
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 h-11 rounded-xl flex items-center justify-center text-[13px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  )
}
