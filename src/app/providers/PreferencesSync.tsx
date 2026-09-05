import { useEffect } from 'react'
import { useGetSettingsQuery } from '@/features/api/appApi'
import { setLanguage, type LangCode } from '@/lib/i18n'
import { usePreferenceStore, type DateFormat } from '@/store/usePreferenceStore'
import { useAuthStore } from '@/store/useAuthStore'

export function PreferencesSync() {
  const token = useAuthStore((s) => s.token)
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !token })

  useEffect(() => {
    if (!settings) return
    const dateFormat = String(settings.dateFormat ?? 'YYYY-MM-DD') as DateFormat
    const currency = String(settings.currency ?? 'SDG')
    usePreferenceStore.getState().setDateFormat(dateFormat)
    usePreferenceStore.getState().setCurrency(currency)

    const stored = localStorage.getItem('language')
    const shopLanguage = String(settings.language ?? '')
    if (!stored && (shopLanguage === 'en' || shopLanguage === 'ar' || shopLanguage === 'bn')) {
      setLanguage(shopLanguage as LangCode)
    }
  }, [settings])

  return null
}
