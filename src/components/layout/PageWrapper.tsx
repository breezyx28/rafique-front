import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-app">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-5 md:p-7">{children}</main>
      </div>
    </div>
  )
}
