import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { PageWrapper } from '@/components/layout/PageWrapper'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <PageWrapper>
      <Outlet />
    </PageWrapper>
  )
}
