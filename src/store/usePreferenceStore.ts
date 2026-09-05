import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LangCode = 'en' | 'ar' | 'bn'
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY'

function readStoredLanguage(): LangCode {
  const stored = localStorage.getItem('language')
  return stored === 'ar' || stored === 'bn' || stored === 'en' ? stored : 'en'
}

interface PreferenceState {
  language: LangCode
  confirmOrderDialog: boolean
  dateFormat: DateFormat
  currency: string
  setLanguage: (code: LangCode) => void
  setConfirmOrderDialog: (value: boolean) => void
  setDateFormat: (value: DateFormat) => void
  setCurrency: (value: string) => void
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      language: readStoredLanguage(),
      confirmOrderDialog: true,
      dateFormat: 'YYYY-MM-DD',
      currency: 'SDG',
      setLanguage: (code) => {
        localStorage.setItem('language', code)
        set({ language: code })
      },
      setConfirmOrderDialog: (value) => set({ confirmOrderDialog: value }),
      setDateFormat: (value) => set({ dateFormat: value === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'YYYY-MM-DD' }),
      setCurrency: (value) => set({ currency: value || 'SDG' }),
    }),
    {
      name: 'jelabeya-prefs',
      partialize: (state) => ({
        confirmOrderDialog: state.confirmOrderDialog,
        dateFormat: state.dateFormat,
        currency: state.currency,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PreferenceState>),
        language: readStoredLanguage(),
      }),
    }
  )
)
