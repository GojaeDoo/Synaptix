export const config = { runtime: 'edge' }

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

const QUERY = `
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    name
    login
    avatarUrl
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            weekday
          }
        }
      }
    }
  }
}
`

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return json({ error: 'not-configured' }, 503)

  const url = new URL(req.url)
  const username = url.searchParams.get('username')?.trim()
  if (!username) return json({ error: 'username required' }, 400)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(username)) {
    return json({ error: 'invalid username' }, 400)
  }

  const to = new Date()
  const from = new Date(to.getFullYear() - 1, to.getMonth(), to.getDate())

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Synaptix',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { username, from: from.toISOString(), to: to.toISOString() },
      }),
    })

    if (!res.ok) return json({ error: `GitHub API ${res.status}` }, res.status)

    const data = await res.json() as { data?: { user: unknown }; errors?: { message: string }[] }
    if (data.errors?.length) return json({ error: data.errors[0].message }, 400)
    if (!data.data?.user) return json({ error: 'user not found' }, 404)

    return new Response(JSON.stringify(data.data.user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown' }, 500)
  }
}
