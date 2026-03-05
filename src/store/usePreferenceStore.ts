import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LangCode = 'en' | 'ar' | 'bn'

interface PreferenceState {
  language: LangCode
  confirmOrderDialog: boolean
  setLanguage: (code: LangCode) => void
  setConfirmOrderDialog: (value: boolean) => void
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      language: (localStorage.getItem('language') as LangCode) ?? 'en',
      confirmOrderDialog: true,
      setLanguage: (code) => set({ language: code }),
      setConfirmOrderDialog: (value) => set({ confirmOrderDialog: value }),
    }),
    { name: 'jelabeya-prefs' }
  )
)
