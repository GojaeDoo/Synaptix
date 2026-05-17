import { create } from 'zustand'
import { format } from 'date-fns'

interface CalendarStore {
  month: Date
  selectedDate: string
  setMonth: (m: Date) => void
  setSelectedDate: (d: string) => void
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  month: new Date(),
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setMonth: (month) => set({ month }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}))
