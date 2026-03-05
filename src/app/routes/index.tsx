import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { NewOrderPage } from '@/features/orders/new/NewOrderPage'
import { ReadyPOSPage } from '@/features/orders/ready/ReadyPOSPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { CustomerEditPage } from '@/features/customers/CustomerEditPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ProductConfigPage } from '@/features/settings/products/ProductConfigPage'
import { InvoicesPage } from '@/features/invoices/InvoicesPage'
import { InvoiceDetailsPage } from '@/features/invoices/InvoiceDetailsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="orders/ready" element={<ReadyPOSPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId/edit" element={<CustomerEditPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:orderNumber" element={<InvoiceDetailsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/products" element={<ProductConfigPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
