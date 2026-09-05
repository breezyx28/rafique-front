import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  FilterToolbar,
  PaginationBar,
  SearchField,
  ToolbarField,
  toolbarSelectClass,
} from '@/components/ui/DataToolbar'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/api/appApi'
import { formatDateTime } from '@/lib/localeFormat'
import { localizeNotification } from '@/lib/displayLabels'

const PAGE_SIZE = 10

export function NotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: notifications = [], isLoading } = useGetNotificationsQuery({ limit: 100 })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | 'due' | 'stock'>('all')
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notifications.filter((row) => {
      const localized = localizeNotification(row)
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        localized.title.toLowerCase().includes(q) ||
        (row.subtitle ?? '').toLowerCase().includes(q) ||
        localized.subtitle.toLowerCase().includes(q)
      const matchesKind = kind === 'all' || row.kind === kind
      const matchesStatus =
        status === 'all' || (status === 'unread' ? !row.isRead : row.isRead)
      return matchesSearch && matchesKind && matchesStatus
    })
  }, [kind, notifications, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const unreadCount = notifications.filter((row) => !row.isRead).length
  const resetPage = () => setPage(1)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('notificationsPage.title', 'Notifications')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t(
              'notificationsPage.subtitle',
              'Delivery-day alerts and low-stock warnings for the shop.',
            )}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!unreadCount}
          onClick={() => void markAllRead()}
        >
          {t('header.markAllRead', 'Mark all read')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t('notificationsPage.listTitle', 'All notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterToolbar>
            <SearchField
              label={t('common.search', 'Search')}
              value={search}
              onChange={(value) => {
                setSearch(value)
                resetPage()
              }}
              placeholder={t('notificationsPage.searchPlaceholder', 'Search title or details')}
            />
            <ToolbarField label={t('notificationsPage.type', 'Type')}>
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as typeof kind)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('notificationsPage.allTypes', 'All types')}</option>
                <option value="due">{t('header.dueDate', 'Due date')}</option>
                <option value="stock">{t('header.stock', 'Stock')}</option>
              </select>
            </ToolbarField>
            <ToolbarField label={t('notificationsPage.status', 'Status')}>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as typeof status)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('notificationsPage.allStatus', 'All')}</option>
                <option value="unread">{t('notificationsPage.unread', 'Unread')}</option>
                <option value="read">{t('notificationsPage.read', 'Read')}</option>
              </select>
            </ToolbarField>
          </FilterToolbar>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-start text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('notificationsPage.colTitle', 'Notification')}</th>
                    <th className="px-4 py-3">{t('notificationsPage.type', 'Type')}</th>
                    <th className="px-4 py-3">{t('notificationsPage.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('notificationsPage.colTime', 'Time')}</th>
                    <th className="px-4 py-3">{t('notificationsPage.colActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    pageRows.map((row) => (
                      <tr key={row.id} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-primary">{localizeNotification(row).title}</p>
                          <p className="text-[12px] text-text-muted">{localizeNotification(row).subtitle || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              row.kind === 'due' ? 'bg-warningBg text-[#B45309]' : 'bg-dangerBg text-danger'
                            }`}
                          >
                            {row.kind === 'due'
                              ? t('header.dueDate', 'Due date')
                              : t('header.stock', 'Stock')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.isRead ? (
                            <span className="text-text-muted">{t('notificationsPage.read', 'Read')}</span>
                          ) : (
                            <span className="font-semibold text-primary">
                              {t('notificationsPage.unread', 'Unread')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!row.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void markRead(row.id)}
                              >
                                {t('notificationsPage.markRead', 'Mark read')}
                              </Button>
                            )}
                            {row.kind === 'due' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (!row.isRead) void markRead(row.id)
                                  navigate('/orders')
                                }}
                              >
                                {t('notificationsPage.openOrders', 'Open orders')}
                              </Button>
                            )}
                            {row.kind === 'stock' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (!row.isRead) void markRead(row.id)
                                  navigate('/ready-products')
                                }}
                              >
                                {t('notificationsPage.openStock', 'Open stock')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!isLoading && pageRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('notificationsPage.empty', 'No notifications match these filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            onPageChange={setPage}
            label={t('notificationsPage.rowsLabel', 'notifications')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
