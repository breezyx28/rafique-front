import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Save, ShieldCheck, Upload, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useGetSettingsQuery, usePatchSettingsMutation, useChangeUserPasswordMutation } from '@/features/api/appApi'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useAuthStore } from '@/store/useAuthStore'
import { API_BASE } from '@/lib/api'

type SettingsTab = 'general' | 'preferences' | 'users' | 'security' | 'backup'

const tabKeys: SettingsTab[] = ['general', 'preferences', 'users', 'security', 'backup']

export function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SettingsTab>('general')
  const { data: settings } = useGetSettingsQuery()
  const [patchSettings, { isLoading }] = usePatchSettingsMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangeUserPasswordMutation()
  const prefStore = usePreferenceStore()
  const authUser = useAuthStore((s) => s.user)

  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')

  const [language, setLanguage] = useState('en')
  const [currency, setCurrency] = useState('SDG')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [printer, setPrinter] = useState('')
  const [showOrderConfirm, setShowOrderConfirm] = useState(true)

  const [securityCurrentPassword, setSecurityCurrentPassword] = useState('')
  const [securityNewPassword, setSecurityNewPassword] = useState('')
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securitySuccess, setSecuritySuccess] = useState('')

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [adminUsername, setAdminUsername] = useState('')

  useEffect(() => {
    if (!settings) return
    setShopName(String(settings.workshopName ?? ''))
    setShopPhone(String(settings.workshopPhone ?? ''))
    setShopAddress(String(settings.workshopAddress ?? ''))

    setLanguage(String(settings.language ?? 'en'))
    setCurrency(String(settings.currency ?? 'SDG'))
    setDateFormat(String(settings.dateFormat ?? 'YYYY-MM-DD'))
    setPrinter(String(settings.printer ?? ''))
    setShowOrderConfirm(Boolean(settings.showOrderSubmitConfirm ?? true))

    setAdminName(String(settings.adminName ?? ''))
    setAdminUsername(String(settings.adminUsername ?? ''))
  }, [settings])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">{t('settingsPage.title', 'Settings')}</h1>
        <p className="text-[13px] text-text-secondary">{t('settingsPage.subtitle', 'Configure shop details, preferences, users, security, and backups.')}</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
            {tabKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                  tab === key ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
                }`}
              >
                {t(`settingsPage.tab${key.charAt(0).toUpperCase() + key.slice(1)}`, key)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {tab === 'general' && (
        <Card>
          <CardHeader><CardTitle>{t('settingsPage.shopInfoTitle', 'Shop Information')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.shopName', 'Shop Name')}</label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.phone', 'Phone')}</label>
              <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.address', 'Address')}</label>
              <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.logo', 'Logo')}</label>
              <Input type="file" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                className="gap-1"
                onClick={() => patchSettings({ workshopName: shopName, workshopPhone: shopPhone, workshopAddress: shopAddress })}
                disabled={isLoading}
              >
                <Save className="h-4 w-4" />{t('settingsPage.saveGeneral', 'Save General Settings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'preferences' && (
        <Card>
          <CardHeader><CardTitle>{t('settingsPage.preferencesTitle', 'Application Preferences')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.language', 'Language')}</label>
              <select
                className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">{t('settingsPage.languageEnglish', 'English')}</option>
                <option value="ar">{t('settingsPage.languageArabic', 'Arabic')}</option>
                <option value="bn">{t('settingsPage.languageBengali', 'Bengali')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.currency', 'Currency')}</label>
              <select
                className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="SDG">SDG</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.dateFormat', 'Date Format')}</label>
              <select
                className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.printerConfig', 'Printer Config')}</label>
              <Input
                placeholder={t('settingsPage.printerPlaceholder', 'Printer name / model')}
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 rounded-[10px] border border-border bg-[#FAFAFA] p-3 text-[13px]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={showOrderConfirm}
                  onChange={(e) => setShowOrderConfirm(e.target.checked)}
                />
                {t('settingsPage.showOrderConfirm', 'Show confirmation dialog before order submit')}
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                className="gap-1"
                onClick={() => {
                  patchSettings({
                    currency,
                    language,
                    dateFormat,
                    printer,
                    showOrderSubmitConfirm: showOrderConfirm,
                  })
                  if (language === 'en' || language === 'ar' || language === 'bn') {
                    prefStore.setLanguage(language)
                  }
                  prefStore.setConfirmOrderDialog(showOrderConfirm)
                }}
              >
                <Save className="h-4 w-4" />{t('settingsPage.savePreferences', 'Save Preferences')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('settingsPage.usersTitle', 'Users & Roles')}</CardTitle>
            <Button
              size="sm"
              className="gap-1"
              onClick={() => {
                setAdminName(String(settings?.adminName ?? ''))
                setAdminUsername(String(settings?.adminUsername ?? ''))
                setIsUserModalOpen(true)
              }}
            >
              <UserPlus className="h-4 w-4" />{t('settingsPage.addUser', 'Add User')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[12px] border border-border">
              <table className="w-full min-w-[620px]">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-left text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('settingsPage.user', 'User')}</th>
                    <th className="px-4 py-3">{t('settingsPage.username', 'Username')}</th>
                    <th className="px-4 py-3">{t('settingsPage.role', 'Role')}</th>
                    <th className="px-4 py-3">{t('settingsPage.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [adminName || String(settings?.adminName ?? 'Admin'), adminUsername || String(settings?.adminUsername ?? 'admin'), 'Admin', t('settingsPage.active', 'Active')],
                  ].map((u) => (
                    <tr key={u[1]} className="border-t border-border text-[13px]">
                      <td className="px-4 py-3 font-semibold text-text-primary">{u[0]}</td>
                      <td className="px-4 py-3 text-text-secondary">{u[1]}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary">{u[2]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-successBg px-2.5 py-0.5 text-[11px] font-semibold text-success">{u[3]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <CardHeader><CardTitle>{t('settingsPage.securityTitle', 'Security')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.currentPassword', 'Current Password')}</label>
              <Input type="password" value={securityCurrentPassword} onChange={(e) => setSecurityCurrentPassword(e.target.value)} />
            </div>
            <div />
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.newPassword', 'New Password')}</label>
              <Input type="password" value={securityNewPassword} onChange={(e) => setSecurityNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-secondary">{t('settingsPage.confirmPassword', 'Confirm New Password')}</label>
              <Input type="password" value={securityConfirmPassword} onChange={(e) => setSecurityConfirmPassword(e.target.value)} />
            </div>
            {securityError && (
              <p className="md:col-span-2 text-[12px] text-danger">
                {securityError}
              </p>
            )}
            {securitySuccess && (
              <p className="md:col-span-2 text-[12px] text-success">
                {securitySuccess}
              </p>
            )}
            <div className="md:col-span-2 flex justify-end">
              <Button
                className="gap-1"
                disabled={isChangingPassword}
                onClick={async () => {
                  setSecurityError('')
                  setSecuritySuccess('')
                  if (!securityNewPassword || !securityConfirmPassword) {
                    setSecurityError(t('settingsPage.passwordRequired', 'New password and confirmation are required.'))
                    return
                  }
                  if (securityNewPassword !== securityConfirmPassword) {
                    setSecurityError(t('settingsPage.passwordMismatch', 'New password and confirmation do not match.'))
                    return
                  }
                  if (!authUser) {
                    setSecurityError(t('settingsPage.noUser', 'No logged-in user.'))
                    return
                  }
                  try {
                    await changePassword({ id: authUser.id, password: securityNewPassword }).unwrap()
                    setSecuritySuccess(t('settingsPage.passwordUpdated', 'Password updated successfully.'))
                    setSecurityCurrentPassword('')
                    setSecurityNewPassword('')
                    setSecurityConfirmPassword('')
                  } catch {
                    setSecurityError(t('settingsPage.passwordUpdateFailed', 'Failed to update password.'))
                  }
                }}
              >
                <ShieldCheck className="h-4 w-4" />{t('settingsPage.updatePassword', 'Update Password')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'backup' && (
        <Card>
          <CardHeader><CardTitle>{t('settingsPage.backupTitle', 'Backup & Restore')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[10px] border border-border bg-[#FAFAFA] p-4">
              <p className="text-[13px] font-semibold text-text-primary">{t('settingsPage.exportTitle', 'Export current database snapshot')}</p>
              <p className="mt-1 text-[12px] text-text-secondary">{t('settingsPage.exportDescription', 'Download a local backup file for offline safety.')}</p>
              <Button
                className="mt-3 gap-1"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${API_BASE}/backup/export`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    })
                    if (!res.ok) return
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'backup.json'
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    window.URL.revokeObjectURL(url)
                  } catch {
                    // ignore for now or hook into toast system
                  }
                }}
              >
                <Download className="h-4 w-4" />{t('settingsPage.exportBackup', 'Export Backup')}
              </Button>
            </div>
            <div className="rounded-[10px] border border-border bg-[#FAFAFA] p-4">
              <p className="text-[13px] font-semibold text-text-primary">{t('settingsPage.importTitle', 'Import / Restore backup')}</p>
              <p className="mt-1 text-[12px] text-text-secondary">{t('settingsPage.importDescription', 'Upload backup file to restore previous state.')}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const token = localStorage.getItem('token')
                      const form = new FormData()
                      form.append('file', file)
                      await fetch(`${API_BASE}/backup/import`, {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                        body: form,
                      })
                    } catch {
                      // ignore or connect to toast system
                    } finally {
                      e.target.value = ''
                    }
                  }}
                />
                <Button variant="outline" className="gap-1" disabled>
                  <Upload className="h-4 w-4" />{t('settingsPage.restore', 'Restore')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)] p-4">
          <div className="w-full max-w-md rounded-[16px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('settingsPage.addUser', 'Add User')}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                  {t('settingsPage.user', 'User')}
                </label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-text-secondary">
                  {t('settingsPage.username', 'Username')}
                </label>
                <Input value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUserModalOpen(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  await patchSettings({ adminName, adminUsername })
                  setIsUserModalOpen(false)
                }}
              >
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

