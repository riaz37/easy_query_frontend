import { create } from 'zustand'

interface ChatState {
  chatDirection: 'ltr' | 'rtl'
  setChatDirection: (direction: 'ltr' | 'rtl') => void
}

export const useChatStore = create<ChatState>((set) => ({
  chatDirection: 'ltr',
  setChatDirection: (direction) => set({ chatDirection: direction }),
}))
