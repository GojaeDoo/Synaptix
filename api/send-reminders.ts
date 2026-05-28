// 일정 리마인더 발송 (Vercel Cron 타깃).
// 매일 23:00 UTC = 08:00 KST에 실행 → "내일"(KST 기준) 일정이 있는 사용자에게 웹 푸시.
// web-push가 Node crypto에 의존하므로 Edge가 아닌 Node 런타임에서 동작한다 (config 미지정 = Node).

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

interface Todo {
  id: string
  title: string
  user_id: string
  due_date: string
}

interface Subscription {
  endpoint: string
  p256dh: string
  auth: string
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// KST 기준 내일 날짜(YYYY-MM-DD).
function tomorrowKstDate(): string {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS)
  const tomorrow = new Date(nowKst.getTime() + 24 * 60 * 60 * 1000)
  const y = tomorrow.getUTCFullYear()
  const m = String(tomorrow.getUTCMonth() + 1).padStart(2, '0')
  const d = String(tomorrow.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 붙인다.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers?.authorization
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublic = process.env.VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return res.status(503).json({ error: 'not-configured' })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  const supabase = createClient(supabaseUrl, serviceKey)

  const targetDate = tomorrowKstDate()

  // 1) 내일 마감인 미완료 일정 조회
  const { data: todos, error: todoErr } = await supabase
    .from('todos')
    .select('id, title, user_id, due_date')
    .eq('due_date', targetDate)
    .eq('completed', false)

  if (todoErr) {
    return res.status(500).json({ error: 'todos-query-failed', detail: todoErr.message })
  }

  const list = (todos ?? []) as Todo[]
  if (list.length === 0) {
    return res.status(200).json({ date: targetDate, users: 0, sent: 0, message: 'no upcoming todos' })
  }

  // 2) 사용자별로 묶기
  const byUser = new Map<string, Todo[]>()
  for (const t of list) {
    const arr = byUser.get(t.user_id) ?? []
    arr.push(t)
    byUser.set(t.user_id, arr)
  }

  let sent = 0
  let removed = 0

  // 3) 각 사용자의 구독으로 발송
  for (const [userId, userTodos] of byUser) {
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (subErr || !subs || subs.length === 0) continue

    const first = userTodos[0].title
    const body =
      userTodos.length === 1
        ? `내일 '${first}' 일정이 있어요.`
        : `내일 '${first}' 외 ${userTodos.length - 1}건의 일정이 있어요.`

    const payload = JSON.stringify({
      title: '📅 내일 일정 알림',
      body,
      url: '/widgets/calendar',
      tag: `reminder-${targetDate}`,
    })

    for (const sub of subs as Subscription[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent++
      } catch (e: unknown) {
        // 410 Gone / 404 → 만료된 구독, 정리
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          removed++
        } else {
          console.error('[send-reminders] push failed', status, e)
        }
      }
    }
  }

  return res.status(200).json({ date: targetDate, users: byUser.size, sent, removed })
}
