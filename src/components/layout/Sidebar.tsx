import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Boxes,
  Receipt,
  Settings,
  Ruler,
  LogOut,
  Printer,
  ChevronDown,
  Hammer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { isAdmin, isCashier, isWorkshop } from '@/lib/roles'
import type { ComponentType } from 'react'
import { useState } from 'react'

const mainNavItems = [
  { to: '/', icon: Home, key: 'dashboard' },
  { to: '/orders/new', icon: FileText, key: 'newOrder' },
  { to: '/orders/ready', icon: ShoppingCart, key: 'readyPOS' },
  { to: '/orders', icon: Package, key: 'orders' },
  { to: '/customers', icon: Users, key: 'customers' },
  { to: '/invoices', icon: Printer, key: 'invoices' },
]

const accountNavItems = [
  { to: '/inventory', icon: Boxes, key: 'inventory' },
  { to: '/expenses', icon: Receipt, key: 'expenses' },
  { to: '/settings/products', icon: Ruler, key: 'productConfig' },
]

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const role = useAuthStore((s) => s.user?.role)
  const workshopOnly = isWorkshop(role)
  const cashierOnly = isCashier(role)
  const adminUser = isAdmin(role)
  const [workshopOpen, setWorkshopOpen] = useState(
    location.pathname.startsWith('/workshop')
  )

  const renderNavItem = (
    to: string,
    Icon: ComponentType<{ className?: string }>,
    label: string,
    badge?: string
  ) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link
        key={to}
        to={to}
        className={cn(
          'flex h-10 items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-primary-light text-primary shadow-nav'
            : 'text-text-secondary hover:bg-[#F5F5F5]'
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
        {!collapsed && badge && (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-surface transition-all duration-200',
        collapsed ? 'w-16' : 'w-[240px]'
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        {!collapsed && (
          <span className="text-[26px] font-bold tracking-[0.02em] text-text-primary">
            {t('app.shopName')}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto px-3 py-4">
        {!workshopOnly && (
          <>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {!collapsed ? 'MAIN MENU' : ''}
            </p>
            <nav className="space-y-1">
              {mainNavItems
                .filter(({ to }) => !(cashierOnly && to === '/'))
                .map(({ to, icon: Icon, key }) =>
                  renderNavItem(to, Icon, t(`nav.${key}`))
                )}
            </nav>
          </>
        )}

        {(adminUser || workshopOnly) && (
        <div className="mt-1">
          {workshopOnly ? (
            renderNavItem('/workshop/orders', Hammer, t('nav.deliveredOrders', 'Delivered Orders'))
          ) : (
            <>
          <button
            type="button"
            onClick={() => setWorkshopOpen((open) => !open)}
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors',
              location.pathname.startsWith('/workshop')
                ? 'bg-primary-light text-primary shadow-nav'
                : 'text-text-secondary hover:bg-[#F5F5F5]'
            )}
          >
            <Hammer className="h-[18px] w-[18px]" />
            {!collapsed && <span>{t('nav.workshop', 'Workshop')}</span>}
            {!collapsed && (
              <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', workshopOpen && 'rotate-180')} />
            )}
          </button>
          {!collapsed && workshopOpen && (
            <div className="mt-1 space-y-1 pl-11">
              {[
                ['/workshop/orders', t('nav.deliveredOrders', 'Delivered Orders')],
                ['/workshop/pricing', t('nav.sewingPricing', 'Sewing Pricing')],
                ['/workshop/payroll', t('nav.tailorPayment', 'Tailor Payment')],
                ['/workshop/productivity', t('nav.productivity', 'Productivity')],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex h-9 items-center rounded-[8px] px-2 text-[12px]',
                    location.pathname === to ? 'font-semibold text-primary' : 'text-text-secondary hover:bg-[#F5F5F5]'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
            </>
          )}
        </div>
        )}

        {adminUser && (
          <>
            <p className="mt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {!collapsed ? 'ACCOUNT MANAGEMENT' : ''}
            </p>
            <nav className="space-y-1">
              {accountNavItems.map(({ to, icon: Icon, key }) =>
                renderNavItem(to, Icon, t(`nav.${key}`))
              )}
            </nav>
          </>
        )}
      </div>

      <div className="space-y-1 border-t border-border px-3 py-4">
        {adminUser && renderNavItem('/settings', Settings, t('nav.settings'))}
        <button
          type="button"
          onClick={clearAuth}
          className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-[#F5F5F5]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
