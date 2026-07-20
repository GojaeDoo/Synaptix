import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bookmark, BookmarkCategory } from '@/types'

interface BookmarkStore {
  bookmarks: Bookmark[]
  addBookmark: (item: Omit<Bookmark, 'id' | 'created_at'>) => void
  removeBookmark: (id: string) => void
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set) => ({
      bookmarks: [],
      addBookmark: (item) =>
        set((s) => ({
          bookmarks: [
            {
              ...item,
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
            },
            ...s.bookmarks,
          ],
        })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    }),
    { name: 'synaptix-bookmarks' }
  )
)

export const BOOKMARK_CATEGORIES: BookmarkCategory[] = ['뉴스', '레시피', '영상', '기타']
