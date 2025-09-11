'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  X,
  Home,
  Package,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useResponsive } from '@/lib/responsive-utils'
import { useAuth } from '@/hooks/use-auth'

interface NavigationItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string | number
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    badge: 'Low Stock',
  },
  {
    title: 'Sales',
    href: '/dashboard/sales',
    icon: ShoppingCart,
    children: [
      { title: 'All Sales', href: '/dashboard/sales', icon: FileText },
      { title: 'New Sale', href: '/dashboard/sales/new', icon: ShoppingCart },
    ],
  },
  {
    title: 'Orders',
    href: '/dashboard/orders',
    icon: FileText,
    badge: 5,
  },
  {
    title: 'Purchases',
    href: '/dashboard/purchases',
    icon: Package,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

interface MobileNavigationProps {
  className?: string
}

interface NavigationItemComponentProps {
  item: NavigationItem
  pathname: string
  onNavigate: () => void
  level?: number
}

const NavigationItemComponent: React.FC<NavigationItemComponentProps> = ({
  item,
  pathname,
  onNavigate,
  level = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0

  useEffect(() => {
    if (isActive && hasChildren) {
      setIsExpanded(true)
    }
  }, [isActive, hasChildren])

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    } else {
      onNavigate()
    }
  }

  const IconComponent = item.icon
  const paddingLeft = `pl-${4 + level * 4}`

  return (
    <div className="space-y-1">
      <div
        className={`
          flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors
          ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }
          ${paddingLeft}
          min-h-[44px] touch-manipulation
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <IconComponent className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto rtl:mr-auto rtl:ml-0">
              {item.badge}
            </Badge>
          )}
        </div>
        {hasChildren && (
          <div className="ml-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {item.children?.map(child => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={`
                flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${
                  pathname === child.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
                pl-8 min-h-[44px] touch-manipulation
              `}
            >
              <child.icon className="h-4 w-4 flex-shrink-0" />
              <span>{child.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const params = useParams()
  const { isMobile } = useResponsive()

  // Determine RTL based on locale
  const locale = params?.locale as string
  const isRTL = locale && ['ar', 'he', 'ug'].includes(locale)

  const handleNavigate = () => {
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  // Don't render on desktop
  if (!isMobile) {
    return null
  }

  return (
    <div className={className}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px] touch-manipulation"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-72 p-0"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-4"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="h-8 w-8 rounded bg-primary"></div>
                <span className="font-semibold">ERP System</span>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>

            {/* User Info */}
            {user && (
              <div className="border-b px-4 py-4" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-2">
                {navigationItems.map(item => (
                  <NavigationItemComponent
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={handleNavigate}
                  />
                ))}
              </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4" dir={isRTL ? 'rtl' : 'ltr'}>
              <Button
                variant="ghost"
                className="w-full justify-start min-h-[44px] touch-manipulation rtl:justify-end"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3 rtl:mr-0 rtl:ml-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
