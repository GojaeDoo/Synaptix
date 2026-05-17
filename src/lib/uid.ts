// crypto.randomUUID는 구형 Safari/비-HTTPS 환경에서 throw — 폴백 포함.
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`
}
