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

function getStoredLanguage(): LangCode {
  const stored = localStorage.getItem('language')
  return stored === 'ar' || stored === 'bn' ? stored : 'en'
}

export function applyDocumentTitle() {
  const shopName = usePreferenceStore.getState().workshopName
  document.title = shopName || i18n.t('app.shopName')
}

function applyDocumentLanguage(code: LangCode) {
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = code
}

const initialLanguage = getStoredLanguage()
applyDocumentLanguage(initialLanguage)

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar }, bn: { translation: bn } },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
applyDocumentTitle()

export function setLanguage(code: LangCode) {
  const lang = languages.find((l) => l.code === code)
  if (lang) {
    applyDocumentLanguage(code)
    usePreferenceStore.getState().setLanguage(code)
    void i18n.changeLanguage(code).then(() => applyDocumentTitle())
  }
}

export default i18n
