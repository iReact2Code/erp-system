'use client'

import * as React from 'react'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useParams, usePathname, useRouter } from 'next/navigation'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳' },
]

export function LanguageToggle() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  const currentLocale = (params?.locale as string) || 'en'

  const handleLanguageChange = (langCode: string) => {
    // Get the current path without locale
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/')

    // Navigate to the new locale URL
    const newUrl = `/${langCode}${
      pathWithoutLocale === '/' ? '' : pathWithoutLocale
    }`
    router.push(newUrl)

    // Apply RTL for Arabic and Hebrew
    const isRTL = ['ar', 'he'].includes(langCode)
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = langCode

    // Store preference
    localStorage.setItem('language', langCode)
  }

  React.useEffect(() => {
    // Load saved language preference on mount
    const savedLang = localStorage.getItem('language')
    if (savedLang && savedLang !== currentLocale) {
      // Only redirect if different from current locale
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/')
      const newUrl = `/${savedLang}${
        pathWithoutLocale === '/' ? '' : pathWithoutLocale
      }`
      router.push(newUrl)
    }
  }, [currentLocale, pathname, router])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLocale === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
