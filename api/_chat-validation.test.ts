import { describe, it, expect } from 'vitest'
import {
  validateChatPayload,
  ALLOWED_TOOL_NAMES,
  MAX_MESSAGES,
  MAX_BODY_BYTES,
} from './_chat-validation'
import { CHAT_TOOLS } from '@/lib/openai'

describe('validateChatPayload', () => {
  it('accepts a well-formed payload', () => {
    const r = validateChatPayload({ messages: [{ role: 'user', content: 'hi' }] })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.tools).toBeUndefined()
  })

  it('passes through known tools and drops unknown ones', () => {
    const r = validateChatPayload({
      messages: [{ role: 'user', content: 'hi' }],
      tools: [
        { type: 'function', function: { name: 'add_todo' } },
        { type: 'function', function: { name: 'evil_exfiltrate' } },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.tools).toHaveLength(1)
      expect((r.value.tools![0] as { function: { name: string } }).function.name).toBe('add_todo')
    }
  })

  it('sets tools to undefined when only unknown tools are sent', () => {
    const r = validateChatPayload({
      messages: [{ role: 'user', content: 'x' }],
      tools: [{ function: { name: 'hack' } }],
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.tools).toBeUndefined()
  })

  it('rejects a non-object body', () => {
    expect(validateChatPayload(null).ok).toBe(false)
    expect(validateChatPayload('nope').ok).toBe(false)
  })

  it('rejects empty / missing messages with 400', () => {
    expect(validateChatPayload({ messages: [] })).toMatchObject({ ok: false, status: 400 })
    expect(validateChatPayload({ tools: [] })).toMatchObject({ ok: false, status: 400 })
  })

  it('rejects a disallowed message role with 400', () => {
    const r = validateChatPayload({ messages: [{ role: 'root', content: 'x' }] })
    expect(r).toMatchObject({ ok: false, status: 400 })
  })

  it('accepts every allowed role', () => {
    const r = validateChatPayload({
      messages: [
        { role: 'system', content: 's' },
        { role: 'user', content: 'u' },
        { role: 'assistant', content: 'a' },
        { role: 'tool', tool_call_id: 't', content: '{}' },
      ],
    })
    expect(r.ok).toBe(true)
  })

  it('rejects too many messages with 400', () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, () => ({ role: 'user', content: 'x' }))
    expect(validateChatPayload({ messages })).toMatchObject({ ok: false, status: 400 })
  })

  it('rejects an oversized payload with 413', () => {
    const messages = [{ role: 'user', content: 'a'.repeat(MAX_BODY_BYTES) }]
    expect(validateChatPayload({ messages })).toMatchObject({ ok: false, status: 413 })
  })

  it('rejects non-array tools with 400', () => {
    const r = validateChatPayload({ messages: [{ role: 'user', content: 'x' }], tools: 'oops' })
    expect(r).toMatchObject({ ok: false, status: 400 })
  })
})

// 드리프트 가드: 서버 화이트리스트(api)와 클라이언트 tool 정의(src)가 어긋나면
// (1) 클라이언트가 호출하는 tool이 서버에서 조용히 잘려나가거나
// (2) 서버가 더 이상 존재하지 않는 tool을 허용하게 된다.
// tool을 추가/삭제할 때 한쪽만 고치면 이 테스트가 깨진다.
describe('tool allowlist stays in sync with CHAT_TOOLS', () => {
  const clientNames = CHAT_TOOLS.map((t) => t.function.name).sort()
  const serverNames = [...ALLOWED_TOOL_NAMES].sort()

  it('every client tool is allowed by the server', () => {
    const missing = clientNames.filter((n) => !ALLOWED_TOOL_NAMES.has(n))
    expect(missing).toEqual([])
  })

  it('the server allows no tool the client does not define', () => {
    const clientSet = new Set(clientNames)
    const extra = serverNames.filter((n) => !clientSet.has(n))
    expect(extra).toEqual([])
  })
})
