import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/auth/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 lg:px-8 rtl:text-right">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
