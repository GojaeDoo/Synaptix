import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WidgetKey, WidgetSettings } from '@/types'

export type Breakpoint = 'lg' | 'md' | 'sm'

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export type Layouts = Record<Breakpoint, LayoutItem[]>

// 12-column desktop, 8-column tablet, 4-column mobile
export const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'weather',  x: 0, y: 0,  w: 3, h: 6,  minW: 2, minH: 4 },
    { i: 'stocks',   x: 3, y: 0,  w: 5, h: 6,  minW: 3, minH: 4 },
    { i: 'chat',     x: 8, y: 0,  w: 4, h: 16, minW: 3, minH: 8 },
    { i: 'calendar', x: 0, y: 6,  w: 3, h: 10, minW: 2, minH: 6 },
    { i: 'news',     x: 3, y: 6,  w: 5, h: 5,  minW: 3, minH: 4 },
    { i: 'budget',   x: 0, y: 16, w: 8, h: 9,  minW: 4, minH: 6 },
    { i: 'places',   x: 0, y: 25, w: 8, h: 8,  minW: 3, minH: 6 },
    { i: 'github',   x: 8, y: 16, w: 4, h: 17, minW: 3, minH: 8 },
  ],
  md: [
    { i: 'weather',  x: 0, y: 0,  w: 4, h: 6,  minW: 2, minH: 4 },
    { i: 'stocks',   x: 4, y: 0,  w: 4, h: 6,  minW: 3, minH: 4 },
    { i: 'news',     x: 0, y: 6,  w: 8, h: 5,  minW: 3, minH: 4 },
    { i: 'calendar', x: 0, y: 11, w: 8, h: 9,  minW: 3, minH: 6 },
    { i: 'budget',   x: 0, y: 20, w: 8, h: 9,  minW: 3, minH: 6 },
    { i: 'places',   x: 0, y: 29, w: 8, h: 8,  minW: 3, minH: 6 },
    { i: 'chat',     x: 0, y: 37, w: 8, h: 10, minW: 3, minH: 8 },
    { i: 'github',   x: 0, y: 47, w: 8, h: 9,  minW: 3, minH: 7 },
  ],
  sm: [
    { i: 'weather',  x: 0, y: 0,  w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'stocks',   x: 2, y: 0,  w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'calendar', x: 0, y: 6,  w: 2, h: 8, minW: 2, minH: 6 },
    { i: 'budget',   x: 2, y: 6,  w: 2, h: 8, minW: 2, minH: 6 },
    { i: 'news',     x: 0, y: 14, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'places',   x: 0, y: 19, w: 4, h: 7, minW: 2, minH: 6 },
    { i: 'github',   x: 0, y: 26, w: 4, h: 8, minW: 2, minH: 6 },
  ],
}

interface WidgetStore {
  visibility: Record<WidgetKey, boolean>
  settings: WidgetSettings
  layouts: Layouts
  editMode: boolean
  toggleWidget: (key: WidgetKey) => void
  showWidget: (key: WidgetKey) => void
  hideWidget: (key: WidgetKey) => void
  updateSettings: (s: Partial<WidgetSettings>) => void
  setLayouts: (l: Layouts) => void
  resetLayouts: () => void
  toggleEditMode: () => void
}

export const useWidgetStore = create<WidgetStore>()(
  persist(
    (set) => ({
      visibility: {
        weather: true,
        stocks: true,
        news: true,
        calendar: true,
        budget: true,
        places: true,
        github: true,
      },
      settings: {
        weatherCity: 'Seoul',
        stockSymbols: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'],
        githubUsername: 'GojaeDoo',
      },
      layouts: DEFAULT_LAYOUTS,
      editMode: false,
      toggleWidget: (key) =>
        set((s) => ({ visibility: { ...s.visibility, [key]: !s.visibility[key] } })),
      showWidget: (key) =>
        set((s) => ({ visibility: { ...s.visibility, [key]: true } })),
      hideWidget: (key) =>
        set((s) => ({ visibility: { ...s.visibility, [key]: false } })),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setLayouts: (layouts) => set({ layouts }),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
    }),
    {
      name: 'synaptix-widgets',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        let state = (persisted ?? {}) as Partial<WidgetStore>
        if (version < 2) {
          state = { ...state, layouts: DEFAULT_LAYOUTS, editMode: false }
        }
        // v3: 장소 위젯 추가.
        if (version < 3) {
          const visibility = { ...(state.visibility ?? {}), places: true } as Record<WidgetKey, boolean>
          const layouts = (state.layouts ?? DEFAULT_LAYOUTS) as Layouts
          const withPlaces: Layouts = {
            lg: layouts.lg.some((l) => l.i === 'places') ? layouts.lg : [...layouts.lg, ...DEFAULT_LAYOUTS.lg.filter((l) => l.i === 'places')],
            md: layouts.md.some((l) => l.i === 'places') ? layouts.md : [...layouts.md, ...DEFAULT_LAYOUTS.md.filter((l) => l.i === 'places')],
            sm: layouts.sm.some((l) => l.i === 'places') ? layouts.sm : [...layouts.sm, ...DEFAULT_LAYOUTS.sm.filter((l) => l.i === 'places')],
          }
          state = { ...state, visibility, layouts: withPlaces }
        }
        // v4: GitHub 위젯 추가. 기본 off (GITHUB_TOKEN 설정 필요).
        if (version < 4) {
          const visibility = { ...(state.visibility ?? {}), github: false } as Record<WidgetKey, boolean>
          const settings = { githubUsername: 'GojaeDoo', ...(state.settings ?? {}) } as WidgetSettings
          const layouts = (state.layouts ?? DEFAULT_LAYOUTS) as Layouts
          const withGithub: Layouts = {
            lg: layouts.lg.some((l) => l.i === 'github') ? layouts.lg : [...layouts.lg, ...DEFAULT_LAYOUTS.lg.filter((l) => l.i === 'github')],
            md: layouts.md.some((l) => l.i === 'github') ? layouts.md : [...layouts.md, ...DEFAULT_LAYOUTS.md.filter((l) => l.i === 'github')],
            sm: layouts.sm.some((l) => l.i === 'github') ? layouts.sm : [...layouts.sm, ...DEFAULT_LAYOUTS.sm.filter((l) => l.i === 'github')],
          }
          state = { ...state, visibility, settings, layouts: withGithub }
        }
        return state as WidgetStore
      },
    }
  )
)
