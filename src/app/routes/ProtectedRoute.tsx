import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  canAccessPath,
  cashierHome,
  isCashier,
  isWorkshop,
  workshopHome,
} from '@/lib/roles'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const role = useAuthStore((s) => s.user?.role)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!canAccessPath(role, location.pathname)) {
    if (isWorkshop(role)) return <Navigate to={workshopHome()} replace />
    if (isCashier(role)) return <Navigate to={cashierHome()} replace />
    return <Navigate to="/" replace />
  }

  return (
    <PageWrapper>
      <Outlet />
    </PageWrapper>
  )
}
