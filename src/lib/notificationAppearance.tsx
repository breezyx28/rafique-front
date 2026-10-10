import {
  AlarmClock,
  Calendar,
  CalendarClock,
  CalendarDays,
  CircleAlert,
  Package,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { NotificationTone } from '@/lib/displayLabels'

export type AlertLevel = 'danger' | 'info' | 'warning' | 'success' | 'error'

export const notificationStyles: Record<
  NotificationTone,
  { icon: LucideIcon; level: AlertLevel; label: string }
> = {
  overdue: { icon: AlarmClock, level: 'error', label: 'header.overdue' },
  dueToday: { icon: CalendarClock, level: 'warning', label: 'header.dueToday' },
  dueTomorrow: { icon: Calendar, level: 'warning', label: 'header.dueTomorrow' },
  dueSoon: { icon: CalendarDays, level: 'info', label: 'header.dueSoon' },
  balanceOverdue: { icon: CircleAlert, level: 'danger', label: 'header.balanceOverdue' },
  balance: { icon: Wallet, level: 'info', label: 'header.balance' },
  needsCustomer: { icon: UserRound, level: 'warning', label: 'header.needsCustomer' },
  stock: { icon: Package, level: 'danger', label: 'header.lowStock' },
}
