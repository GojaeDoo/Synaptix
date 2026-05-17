import { ConfigError } from './api'

// 위젯 데이터 폴백 정책 (UX 일관성):
// - 키가 필요한 외부 API (weather/stocks): 키 미설정 → mock (ConfigError만)
// - 키가 필요 없는 외부 API (crypto/news): upstream 장애 → mock (모든 에러)
//   포트폴리오 데모가 외부 의존성 때문에 깨지지 않도록.

export async function withMockOnConfigError<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetcher()
  } catch (e) {
    if (e instanceof ConfigError) return fallback
    throw e
  }
}

export async function withMockOnAnyError<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await fetcher()
  } catch (e) {
    console.warn(`[${label}] upstream 실패 — mock으로 폴백`, e)
    return fallback
  }
}
