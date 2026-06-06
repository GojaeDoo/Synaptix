import { useQuery } from '@tanstack/react-query'
import { useWidgetStore } from '@/store/widgetStore'

export interface ContributionDay {
  date: string
  contributionCount: number
  weekday: number
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface GithubData {
  name: string | null
  login: string
  avatarUrl: string
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number
      weeks: ContributionWeek[]
    }
  }
}

async function fetchGithub(username: string): Promise<GithubData> {
  const res = await fetch(`/api/github?username=${encodeURIComponent(username)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    if (res.status === 503) throw new Error('not-configured')
    throw new Error(err.error ?? `GitHub API ${res.status}`)
  }
  return res.json() as Promise<GithubData>
}

export function useGithub() {
  const username = useWidgetStore((s) => s.settings.githubUsername)

  return useQuery({
    queryKey: ['github', username],
    queryFn: () => fetchGithub(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 60,
    retry: false,
  })
}
