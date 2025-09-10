import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI ERP System',
  description: 'Enterprise Resource Planning System with AI capabilities',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
