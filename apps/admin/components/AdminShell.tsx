'use client'

import { useState } from 'react'
import AdminNav from './AdminNav'
import TopBar from './TopBar'
import ToastProvider from './ToastProvider'

interface AdminShellProps {
  userEmail: string
  userRole: string
  children: React.ReactNode
}

export default function AdminShell({ userEmail, userRole, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar — drawer on mobile, static on desktop */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AdminNav
            userEmail={userEmail}
            userRole={userRole}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
          <TopBar onMenuOpen={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
