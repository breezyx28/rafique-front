import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import ar from '../locales/ar.json'
import bn from '../locales/bn.json'
import { usePreferenceStore } from '@/store/usePreferenceStore'

export const languages = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'bn', label: 'বাংলা', dir: 'ltr' },
] as const

export type LangCode = 'en' | 'ar' | 'bn'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar }, bn: { translation: bn } },
  lng: localStorage.getItem('language') ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(code: LangCode) {
  const lang = languages.find((l) => l.code === code)
  if (lang) {
    document.documentElement.dir = lang.dir
    document.documentElement.lang = code
    // Keep i18n instance and preference store in sync
    usePreferenceStore.getState().setLanguage(code)
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }
}

export default i18n
