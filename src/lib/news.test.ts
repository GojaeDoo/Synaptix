import { describe, it, expect } from 'vitest'
import { parseSource, enrich, filterAndSort, computeStats, type EnrichedArticle } from './news'
import type { NewsArticle } from '@/types'

function article(over: Partial<NewsArticle> & Pick<NewsArticle, 'title'>): NewsArticle {
  return {
    description: null,
    url: over.url ?? `https://example.com/${over.title}`,
    source: over.source ?? { name: '' },
    publishedAt: over.publishedAt ?? '2020-01-01T00:00:00Z',
    urlToImage: null,
    ...over,
  }
}

describe('parseSource', () => {
  it('extracts score and comments from the encoded name', () => {
    expect(parseSource('▲123 💬45')).toEqual({ score: 123, comments: 45 })
  })

  it('defaults missing fields to 0', () => {
    expect(parseSource('no metadata')).toEqual({ score: 0, comments: 0 })
    expect(parseSource('▲10')).toEqual({ score: 10, comments: 0 })
  })
})

describe('enrich', () => {
  it('assigns 1-based rank in original order and unpacks score/comments', () => {
    const result = enrich([
      article({ title: 'a', source: { name: '▲50 💬3' } }),
      article({ title: 'b', source: { name: '▲10 💬1' } }),
    ])
    expect(result.map((a) => [a.rank, a.score, a.comments])).toEqual([
      [1, 50, 3],
      [2, 10, 1],
    ])
  })
})

describe('filterAndSort', () => {
  const enriched: EnrichedArticle[] = [
    { ...article({ title: 'React 19', publishedAt: '2020-06-01T00:00:00Z' }), rank: 1, score: 100, comments: 5 },
    { ...article({ title: 'Vue news', publishedAt: '2020-06-03T00:00:00Z' }), rank: 2, score: 300, comments: 1 },
    { ...article({ title: 'Rust tips', publishedAt: '2020-06-02T00:00:00Z' }), rank: 3, score: 200, comments: 9 },
  ]

  it('filters by title (case-insensitive)', () => {
    expect(filterAndSort(enriched, 'react', 'rank').map((a) => a.title)).toEqual(['React 19'])
  })

  it('sorts by rank by default', () => {
    expect(filterAndSort(enriched, '', 'rank').map((a) => a.rank)).toEqual([1, 2, 3])
  })

  it('sorts by score / comments / recency descending', () => {
    expect(filterAndSort(enriched, '', 'score').map((a) => a.score)).toEqual([300, 200, 100])
    expect(filterAndSort(enriched, '', 'comments').map((a) => a.comments)).toEqual([9, 5, 1])
    expect(filterAndSort(enriched, '', 'recent').map((a) => a.title)).toEqual([
      'Vue news',
      'Rust tips',
      'React 19',
    ])
  })
})

describe('computeStats', () => {
  it('totals score/comments and picks the highest-scoring story', () => {
    const enriched: EnrichedArticle[] = [
      { ...article({ title: 'a' }), rank: 1, score: 100, comments: 5 },
      { ...article({ title: 'b' }), rank: 2, score: 300, comments: 1 },
    ]
    expect(computeStats(enriched)).toMatchObject({
      count: 2,
      totalScore: 400,
      totalComments: 6,
    })
    expect(computeStats(enriched).topStory?.title).toBe('b')
  })

  it('returns a null topStory for an empty list', () => {
    expect(computeStats([])).toEqual({ count: 0, totalScore: 0, totalComments: 0, topStory: null })
  })
})
