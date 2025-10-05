import type { Metadata } from 'next'
import './globals.css'
import { reportConfigDrift } from '@/lib/config-drift'

export const metadata: Metadata = {
  title: 'AI ERP System',
  description: 'Enterprise Resource Planning System with AI capabilities',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Non-fatal: surfaces missing/extra env vars early in runtime logs
  if (
    typeof window === 'undefined' &&
    (process.env.NODE_ENV === 'production' || process.env.CI === 'true')
  ) {
    // server only
    try {
      reportConfigDrift({ ignoreExtra: true })
    } catch {}
  }
  return children
}
