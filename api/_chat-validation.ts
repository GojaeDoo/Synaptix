// /api/chat 페이로드 검증 — 프로덕션 Edge 함수(api/chat.ts)와 dev 미들웨어(vite.config.ts)가
// 동일한 규칙을 쓰도록 단일 소스로 둔다. (다른 상수들은 두 런타임에 의도적으로 중복돼 있지만,
// 보안 검증은 한쪽만 바뀌면 구멍이 생기므로 공유한다.)
//
// 이 endpoint는 인증이 없는 공개 프록시(데모 모드를 위해 의도된 설계)라, rate limit만으로는
// 부족하다. 누군가 이걸 "무료 Gemini 릴레이"로 악용하는 것을 막는 1차 방어선:
//   - 메시지 개수 / 직렬화 크기 상한 → 비용 폭주·context-stuffing 차단
//   - role 화이트리스트 → 망가진 페이로드를 Gemini 호출 전에 거른다
//   - tool 이름 화이트리스트 → 임의 함수 정의를 주입해 범용 function-calling 릴레이로
//     쓰지 못하게 한다(서버가 아는 tool만 통과)

export const MAX_MESSAGES = 50
export const MAX_BODY_BYTES = 32_768 // 직렬화된 messages 기준

const ALLOWED_ROLES = new Set(['system', 'user', 'assistant', 'tool'])

// src/lib/openai.ts 의 CHAT_TOOLS 와 이름이 일치해야 한다.
export const ALLOWED_TOOL_NAMES = new Set([
  'set_widget_visibility',
  'add_todo',
  'add_transaction',
  'change_weather_city',
  'lookup_weather',
  'lookup_stock',
  'query_todos',
  'query_transactions',
  'update_todo',
  'delete_todo',
  'update_transaction',
  'delete_transaction',
])

export interface ValidatedChat {
  messages: unknown[]
  tools: unknown[] | undefined
}

export type ValidationResult =
  | { ok: true; value: ValidatedChat }
  | { ok: false; status: number; message: string }

export function validateChatPayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, status: 400, message: 'body must be a JSON object' }
  }
  const { messages, tools } = body as { messages?: unknown; tools?: unknown }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, message: 'messages must be a non-empty array' }
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, status: 400, message: `too many messages (max ${MAX_MESSAGES})` }
  }

  // 직렬화 크기 상한 — 한 번의 요청이 일으킬 수 있는 비용을 묶어둔다.
  const bytes = new TextEncoder().encode(JSON.stringify(messages)).length
  if (bytes > MAX_BODY_BYTES) {
    return { ok: false, status: 413, message: `payload too large (max ${MAX_BODY_BYTES} bytes)` }
  }

  for (const m of messages) {
    const role = (m as { role?: unknown })?.role
    if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) {
      return { ok: false, status: 400, message: `invalid message role: ${String(role)}` }
    }
  }

  // tools는 선택적. 보내더라도 서버가 아는 이름만 통과시키고 나머지는 버린다.
  let safeTools: unknown[] | undefined
  if (tools !== undefined) {
    if (!Array.isArray(tools)) {
      return { ok: false, status: 400, message: 'tools must be an array' }
    }
    const filtered = tools.filter((t) => {
      const name = (t as { function?: { name?: unknown } })?.function?.name
      return typeof name === 'string' && ALLOWED_TOOL_NAMES.has(name)
    })
    safeTools = filtered.length > 0 ? filtered : undefined
  }

  return { ok: true, value: { messages, tools: safeTools } }
}
