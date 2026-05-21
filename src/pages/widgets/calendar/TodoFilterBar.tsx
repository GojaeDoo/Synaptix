import { Search } from 'lucide-react'
import type { StatusFilter, PriorityFilter } from '@/lib/todos'
import { BORDER, fieldStyle } from './constants'

interface Props {
  search: string
  status: StatusFilter
  priority: PriorityFilter
  onSearch: (v: string) => void
  onStatus: (v: StatusFilter) => void
  onPriority: (v: PriorityFilter) => void
}

// 검색 + 상태/우선순위 필터. 상태는 목록과 공유하므로 부모(TodoPanel)가 소유한다.
export function TodoFilterBar({ search, status, priority, onSearch, onStatus, onPriority }: Props) {
  return (
    <div
      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="relative w-full sm:flex-1">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#636366' }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="할 일 검색"
          aria-label="할 일 제목으로 검색"
          type="search"
          className="w-full"
          style={{ ...fieldStyle, paddingLeft: 32 }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:shrink-0">
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value as StatusFilter)}
          className="min-w-0 sm:w-[110px]"
          style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
        >
          <option value="all" style={{ background: '#141730' }}>전체</option>
          <option value="pending" style={{ background: '#141730' }}>진행 중</option>
          <option value="done" style={{ background: '#141730' }}>완료</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onPriority(e.target.value as PriorityFilter)}
          className="min-w-0 sm:w-[110px]"
          style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
        >
          <option value="all" style={{ background: '#141730' }}>모든 우선순위</option>
          <option value="high" style={{ background: '#141730' }}>높음</option>
          <option value="medium" style={{ background: '#141730' }}>보통</option>
          <option value="low" style={{ background: '#141730' }}>낮음</option>
        </select>
      </div>
    </div>
  )
}
