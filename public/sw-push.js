// 웹 푸시 수신 핸들러.
// vite-plugin-pwa가 생성하는 서비스워커가 workbox.importScripts로 이 파일을 불러옴
// (vite.config.ts 참고). 여기에 push / notificationclick 이벤트만 추가한다.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Synaptix'
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // 같은 tag면 알림이 덮어써져 중복 방지
    tag: payload.tag || 'synaptix-reminder',
    data: { url: payload.url || '/widgets/calendar' },
    // 사용자가 직접 닫기 전까지 유지 (모바일에서 더 카톡스럽게)
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭이 있으면 그쪽으로 포커스
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl).catch(() => {})
            return client.focus()
          }
        }
        // 없으면 새 창 열기
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
      }),
  )
})
