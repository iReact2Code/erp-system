'use client'

import { Link, usePathname } from '@/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { LanguageToggle } from '@/components/theme/language-toggle'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import Email from '@/components/ui/email'
// import { useRouter } from 'next/navigation'
const navigationKeys = {
  CLERK: ['dashboard', 'inventory', 'sales', 'profile'],
  SUPERVISOR: [
    'dashboard',
    'inventory',
    'sales',
    'purchases',
    'reports',
    'users',
    // const router = useRouter()
  ],
  THIRD_PARTY_CLIENT: ['dashboard', 'orders', 'profile'],
}

// import { useRouter } from 'next/navigation'

export function Header() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const params = useParams()
  const locale = params?.locale as string
  const isRTL = locale === 'ar' || locale === 'he' || locale === 'ug'
  const t = useTranslations('navigation')
  const tAuth = useTranslations('auth')

  if (!user) return null

  const userRole = user.role as keyof typeof navigationKeys
  const navKeys = navigationKeys[userRole] || []

  return (
    <header className="px-4 border-b shadow-md bg-background lg:px-6 animate-slide-in-left">
      <div className="container flex items-center justify-between h-16 mx-auto">
        <div
          className="flex items-center gap-6 header-nav"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Link href="/dashboard" className="text-xl font-bold hover-glow">
            ERP System
          </Link>

          {/* Desktop Navigation */}
          <nav className="items-center hidden space-x-1 md:flex">
            {navKeys.map((key, index) => (
              <Link
                key={key}
                href={`/${key}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  pathname.includes(`/${key}`)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Theme Toggle */}
          <div className="hover-scale">
            <ThemeToggle />
          </div>

          {/* Language Toggle */}
          <div className="hover-scale">
            <LanguageToggle />
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="hover-scale">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isRTL ? 'right' : 'left'}
              className="w-72 sheet-content"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <nav className="flex flex-col mt-4 space-y-4">
                {navKeys.map(key => (
                  <Link
                    key={key}
                    href={`/${key}`}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname.includes(`/${key}`)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {t(key)}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 dropdown-content"
              align={isRTL ? 'start' : 'end'}
              forceMount
            >
              <div
                className="flex flex-col p-2 space-y-1"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  <Email className="truncate">{user.email}</Email>
                </p>
              </div>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                <span>{tAuth('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
