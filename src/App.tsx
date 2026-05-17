import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './hooks/useAuth'

// Detail 페이지는 초기 진입에 필요 없으므로 라우트 단위 lazy로 분리.
// recharts 등 무거운 차트 라이브러리도 함께 split 된다.
const BudgetDetail = lazy(() =>
  import('./pages/widgets/BudgetDetail').then((m) => ({ default: m.BudgetDetail }))
)
const WeatherDetail = lazy(() =>
  import('./pages/widgets/WeatherDetail').then((m) => ({ default: m.WeatherDetail }))
)
const StocksDetail = lazy(() =>
  import('./pages/widgets/StocksDetail').then((m) => ({ default: m.StocksDetail }))
)
const CalendarDetail = lazy(() =>
  import('./pages/widgets/CalendarDetail').then((m) => ({ default: m.CalendarDetail }))
)
const NewsDetail = lazy(() =>
  import('./pages/widgets/NewsDetail').then((m) => ({ default: m.NewsDetail }))
)

function Spinner() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0F0F0F]">
      <div className="w-6 h-6 rounded-full border-2 border-[#3182F6] border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <Spinner />

  // 모든 경로를 비로그인에서도 접근 가능하게 열어두고, 데이터 훅이 세션 유무에 따라
  // Supabase vs 데모 스토어로 알아서 라우팅한다.
  return (
    <ErrorBoundary variant="page" name="app">
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/widgets/budget" element={<BudgetDetail />} />
          <Route path="/widgets/weather" element={<WeatherDetail />} />
          <Route path="/widgets/stocks" element={<StocksDetail />} />
          <Route path="/widgets/calendar" element={<CalendarDetail />} />
          <Route path="/widgets/news" element={<NewsDetail />} />
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
