import type { NewsArticle } from '@/types'

// 해커뉴스 위젯의 순수 변환/집계 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// NewsDetail과 그 하위 컴포넌트가 공유한다.

export type SortMode = 'rank' | 'recent' | 'score' | 'comments'

export interface EnrichedArticle extends NewsArticle {
  rank: number
  score: number
  comments: number
}

// HN 위젯은 source.name에 "▲점수 💬댓글" 형태로 메타데이터를 인코딩해 보낸다.
export function parseSource(name: string): { score: number; comments: number } {
  const score = Number(name.match(/▲(\d+)/)?.[1] ?? 0)
  const comments = Number(name.match(/💬(\d+)/)?.[1] ?? 0)
  return { score, comments }
}

// 원본 배열 순서를 HN 랭킹으로 보고 rank를 매기며 점수/댓글을 펼친다.
export function enrich(articles: NewsArticle[]): EnrichedArticle[] {
  return articles.map((a, i) => ({ ...a, rank: i + 1, ...parseSource(a.source.name) }))
}

export function filterAndSort(
  articles: EnrichedArticle[],
  search: string,
  sort: SortMode,
): EnrichedArticle[] {
  const q = search.trim().toLowerCase()
  let filtered = articles
  if (q) filtered = filtered.filter((a) => a.title.toLowerCase().includes(q))
  const sorted = [...filtered]
  switch (sort) {
    case 'recent':
      sorted.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      break
    case 'score':
      sorted.sort((a, b) => b.score - a.score)
      break
    case 'comments':
      sorted.sort((a, b) => b.comments - a.comments)
      break
    default:
      sorted.sort((a, b) => a.rank - b.rank)
  }
  return sorted
}

export interface NewsStats {
  count: number
  totalScore: number
  totalComments: number
  topStory: EnrichedArticle | null
}

export function computeStats(articles: EnrichedArticle[]): NewsStats {
  const totalScore = articles.reduce((s, a) => s + a.score, 0)
  const totalComments = articles.reduce((s, a) => s + a.comments, 0)
  const topStory = articles.reduce<EnrichedArticle | null>(
    (best, a) => (best == null || a.score > best.score ? a : best),
    null,
  )
  return { count: articles.length, totalScore, totalComments, topStory }
}
