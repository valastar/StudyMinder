'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading])

  // Cerrar sidebar al cambiar de página en mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header mobile — solo visible en < lg */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar: fixed en ambos casos, en desktop siempre visible */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main: margen izquierdo solo en desktop para la sidebar fija */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}