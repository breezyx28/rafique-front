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
      setLanguage: (code) => {
        localStorage.setItem('language', code)
        set({ language: code })
      },
      setConfirmOrderDialog: (value) => set({ confirmOrderDialog: value }),
    }),
    {
      name: 'jelabeya-prefs',
      partialize: (state) => ({
        confirmOrderDialog: state.confirmOrderDialog,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PreferenceState>),
        language: (localStorage.getItem('language') as LangCode) ?? 'en',
      }),
    }
  )
)
