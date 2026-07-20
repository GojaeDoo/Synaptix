import { useState } from 'react'
import { Bookmark, Plus, X, ArrowUpRight, Tag } from 'lucide-react'
import { useBookmarkStore, BOOKMARK_CATEGORIES } from '@/store/bookmarkStore'
import type { BookmarkCategory } from '@/types'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'

const CATEGORY_COLORS: Record<BookmarkCategory, { bg: string; text: string }> = {
  뉴스:   { bg: 'rgba(49,130,246,0.18)',  text: '#3182F6' },
  레시피: { bg: 'rgba(52,199,89,0.18)',   text: '#34C759' },
  영상:   { bg: 'rgba(255,69,58,0.18)',   text: '#FF453A' },
  기타:   { bg: 'rgba(142,142,147,0.18)', text: '#8E8E93' },
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface AddFormProps {
  onSubmit: (data: { title: string; url: string; category: BookmarkCategory; memo?: string }) => void
  onCancel: () => void
}

function AddForm({ onSubmit, onCancel }: AddFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState<BookmarkCategory>('기타')
  const [memo, setMemo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const normalized = url.startsWith('http') ? url : `https://${url}`
    onSubmit({ title: title.trim(), url: normalized, category, memo: memo.trim() || undefined })
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      style={{
        margin: '0 14px 12px',
        padding: '12px 14px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <input
        autoFocus
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="URL (https://...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={inputStyle}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as BookmarkCategory)}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        {BOOKMARK_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        placeholder="메모 (선택)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>취소</button>
        <button
          type="submit"
          disabled={!title.trim() || !url.trim()}
          style={{
            ...saveBtnStyle,
            opacity: !title.trim() || !url.trim() ? 0.4 : 1,
            cursor: !title.trim() || !url.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          저장
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 12,
  color: '#F2F2F7',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const cancelBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 11,
  color: '#636366',
  cursor: 'pointer',
}

const saveBtnStyle: React.CSSProperties = {
  background: '#3182F6',
  border: 'none',
  borderRadius: 6,
  padding: '5px 14px',
  fontSize: 11,
  color: '#fff',
  fontWeight: 600,
}

export function BookmarkWidget() {
  const { bookmarks, addBookmark, removeBookmark } = useBookmarkStore()
  const [adding, setAdding] = useState(false)
  const [activeCategory, setActiveCategory] = useState<BookmarkCategory | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? bookmarks
    : bookmarks.filter((b) => b.category === activeCategory)

  const handleAdd = (data: { title: string; url: string; category: BookmarkCategory; memo?: string }) => {
    addBookmark(data)
    setAdding(false)
  }

  return (
    <div
      id="widget-bookmarks"
      className="widget-glass h-full rounded-[8px] relative overflow-hidden flex flex-col"
      style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bookmark size={13} style={{ color: '#3182F6' }} />
          <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#AEAEB2', letterSpacing: '0.06em' }}>BOOKMARKS</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setAdding((v) => !v) }}
          aria-label="북마크 추가"
          style={{
            background: adding ? 'rgba(49,130,246,0.2)' : 'none',
            border: 'none',
            cursor: 'pointer',
            color: adding ? '#3182F6' : '#636366',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            transition: 'color 0.15s',
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 추가 폼 */}
      {adding && (
        <AddForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
      )}

      {/* 카테고리 탭 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 6,
          padding: '0 14px 10px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          flexShrink: 0,
        }}
      >
        {(['all', ...BOOKMARK_CATEGORIES] as const).map((cat) => {
          const isActive = activeCategory === cat
          const color = cat === 'all' ? '#3182F6' : CATEGORY_COLORS[cat].text
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                background: isActive ? (cat === 'all' ? 'rgba(49,130,246,0.18)' : CATEGORY_COLORS[cat].bg) : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isActive ? color + '55' : 'transparent'}`,
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 11,
                color: isActive ? color : '#636366',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {cat === 'all' ? '전체' : cat}
            </button>
          )
        })}
      </div>

      {/* 북마크 목록 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(49,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} style={{ color: '#3182F6' }} />
            </div>
            <p style={{ fontSize: 12, color: '#48484A', textAlign: 'center' }}>
              {activeCategory === 'all' ? '저장된 링크가 없어요' : `${activeCategory} 링크가 없어요`}
            </p>
          </div>
        ) : (
          filtered.map((bm) => {
            const colors = CATEGORY_COLORS[bm.category]
            return (
              <div
                key={bm.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => window.open(bm.url, '_blank', 'noopener')}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 7px',
                        borderRadius: 10,
                        background: colors.bg,
                        color: colors.text,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {bm.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#F2F2F7', fontWeight: 500, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bm.title}
                  </p>
                  <p style={{ fontSize: 11, color: '#636366', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getDomain(bm.url)}
                  </p>
                  {bm.memo && (
                    <p style={{ fontSize: 11, color: '#48484A', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {bm.memo}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(bm.url, '_blank', 'noopener') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 3, display: 'flex' }}
                    aria-label="링크 열기"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366', padding: 3, display: 'flex' }}
                    aria-label="삭제"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
