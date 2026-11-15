import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LangCode = 'en' | 'ar' | 'bn'
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY'
export type ThemeMode = 'light' | 'dark'

function readStoredLanguage(): LangCode {
  const stored = localStorage.getItem('language')
  return stored === 'ar' || stored === 'bn' || stored === 'en' ? stored : 'en'
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem('theme')
  return stored === 'dark' ? 'dark' : 'light'
}

export function applyDocumentTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

interface PreferenceState {
  language: LangCode
  theme: ThemeMode
  confirmOrderDialog: boolean
  dateFormat: DateFormat
  currency: string
  workshopName: string
  workshopAddress: string
  workshopPhone: string
  setLanguage: (code: LangCode) => void
  setTheme: (theme: ThemeMode) => void
  setConfirmOrderDialog: (value: boolean) => void
  setDateFormat: (value: DateFormat) => void
  setCurrency: (value: string) => void
  setShopProfile: (value: { workshopName?: string; workshopAddress?: string; workshopPhone?: string }) => void
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      language: readStoredLanguage(),
      theme: readStoredTheme(),
      confirmOrderDialog: true,
      dateFormat: 'YYYY-MM-DD',
      currency: 'SDG',
      workshopName: '',
      workshopAddress: '',
      workshopPhone: '',
      setLanguage: (code) => {
        localStorage.setItem('language', code)
        set({ language: code })
      },
      setTheme: (theme) => {
        applyDocumentTheme(theme)
        set({ theme })
      },
      setConfirmOrderDialog: (value) => set({ confirmOrderDialog: value }),
      setDateFormat: (value) => set({ dateFormat: value === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'YYYY-MM-DD' }),
      setCurrency: (value) => set({ currency: value || 'SDG' }),
      setShopProfile: (value) =>
        set({
          workshopName: value.workshopName ?? '',
          workshopAddress: value.workshopAddress ?? '',
          workshopPhone: value.workshopPhone ?? '',
        }),
    }),
    {
      name: 'jelabeya-prefs',
      partialize: (state) => ({
        confirmOrderDialog: state.confirmOrderDialog,
        dateFormat: state.dateFormat,
        currency: state.currency,
        theme: state.theme,
      }),
      merge: (persisted, current) => {
        const next = {
          ...current,
          ...(persisted as Partial<PreferenceState>),
          language: readStoredLanguage(),
          theme: (persisted as Partial<PreferenceState>)?.theme === 'dark' || readStoredTheme() === 'dark' ? 'dark' as const : 'light' as const,
        }
        applyDocumentTheme(next.theme)
        return next
      },
    }
  )
)
