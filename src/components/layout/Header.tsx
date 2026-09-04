import { useTranslation } from 'react-i18next'
import { Bell, ChevronDown, Globe2, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { languages, setLanguage, type LangCode } from '@/lib/i18n'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import {
  loadSeenNotificationIds,
  persistSeenNotificationIds,
  playNotificationSound,
  unlockNotificationAudio,
} from '@/lib/notificationSound'
import {
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/api/appApi'

const POLL_MS = 20_000

export function Header() {
  const { user } = useAuthStore()
  const lang = usePreferenceStore((s) => s.language)
  const { t } = useTranslation()
  const username = user?.username ?? 'User'
  const avatarInitial = username.slice(0, 1).toUpperCase()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const seenIdsRef = useRef<Set<number>>(loadSeenNotificationIds())

  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsQuery(
    { limit: 20 },
    { pollingInterval: POLL_MS },
  )
  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, {
    pollingInterval: POLL_MS,
  })
  const [markNotificationRead] = useMarkNotificationReadMutation()
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation()
  const unreadCount = unreadData?.unread ?? notifications.filter((a) => !a.isRead).length
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  useEffect(() => {
    const unlock = () => unlockNotificationAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const unseen = notifications.filter((item) => !seenIdsRef.current.has(item.id))
    if (!unseen.length) return
    const hasFreshUnread = unseen.some((item) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0
      return !item.isRead && Date.now() - created < 120_000
    })
    if (hasFreshUnread) playNotificationSound()
    unseen.forEach((item) => seenIdsRef.current.add(item.id))
    persistSeenNotificationIds(seenIdsRef.current)
  }, [notifications])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false)
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setIsLangOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false)
        setIsLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-7">
      <div className="relative" ref={langRef}>
        <button
          type="button"
          onClick={() => {
            setIsLangOpen((v) => !v)
            setIsNotificationOpen(false)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-primary-light hover:text-primary"
        >
          <Globe2 className="h-4 w-4" />
          {lang.toUpperCase()}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {isLangOpen && (
          <div className="absolute left-0 top-11 z-30 w-40 rounded-[12px] border border-border bg-white p-1 shadow-lg">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code as LangCode)
                  setIsLangOpen(false)
                }}
                className={`w-full rounded-[8px] px-3 py-2 text-left text-[13px] ${
                  lang === l.code
                    ? 'bg-primary-light font-semibold text-primary'
                    : 'text-text-secondary hover:bg-[#F5F5F5]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
          aria-label={t('header.messages', 'Messages')}
        >
          <Mail className="h-[16px] w-[16px]" />
        </button>
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              unlockNotificationAudio()
              setIsNotificationOpen((v) => !v)
              setIsLangOpen(false)
            }}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F5] text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
            aria-label={t('header.notifications', 'Notifications')}
          >
            <Bell className="h-[16px] w-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                {badgeLabel}
              </span>
            )}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 top-11 z-30 w-[320px] rounded-[12px] border border-border bg-white p-2 shadow-lg">
              <div className="mb-1 flex items-center justify-between px-2 py-1">
                <p className="text-[13px] font-semibold text-text-primary">
                  {t('header.latestAlerts', 'Latest Alerts')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!unreadCount) return
                    markAllNotificationsRead()
                  }}
                  className="cursor-pointer text-[11px] font-medium text-primary hover:underline"
                >
                  {t('header.markAllRead', 'Mark all read')}
                </button>
              </div>
              <div className="max-h-72 space-y-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {notificationsLoading && (
                  <p className="px-3 py-2 text-[12px] text-text-muted">
                    {t('header.loadingNotifications', 'Loading notifications…')}
                  </p>
                )}
                {!notificationsLoading && notifications.length === 0 && (
                  <p className="px-3 py-2 text-[12px] text-text-muted">
                    {t('header.noAlerts', 'No alerts yet.')}
                  </p>
                )}
                {notifications.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      if (!a.isRead) {
                        markNotificationRead(a.id)
                      }
                    }}
                    className={`w-full cursor-pointer rounded-[10px] px-3 py-2 text-left hover:bg-[#F5F5F5] ${
                      a.isRead ? '' : 'bg-primary-light/50'
                    }`}
                  >
                    <p className="text-[12px] font-medium text-text-primary">{a.title}</p>
                    {a.subtitle && (
                      <p className="text-[11px] text-text-muted">{a.subtitle}</p>
                    )}
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        a.kind === 'due' ? 'bg-warningBg text-[#B45309]' : 'bg-dangerBg text-danger'
                      }`}
                    >
                      {a.kind === 'due'
                        ? t('header.dueDate', 'Due date')
                        : t('header.stock', 'Stock')}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t border-border px-2 pt-2">
                <Link
                  to="/notifications"
                  onClick={() => setIsNotificationOpen(false)}
                  className="block cursor-pointer rounded-[8px] px-2 py-1.5 text-center text-[12px] font-semibold text-primary hover:bg-primary-light"
                >
                  {t('header.viewAll', 'View all notifications')}
                </Link>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-[#F5F5F5]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-[12px] font-semibold text-primary">
            {avatarInitial}
          </span>
          <span className="text-[14px] font-semibold text-text-primary">{username}</span>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>
      </div>
    </header>
  )
}
