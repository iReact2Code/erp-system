'use client'

import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface LanguageFontProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function LanguageFont({
  children,
  className,
  as: Component = 'div',
}: LanguageFontProps) {
  const locale = useLocale()

  const getFontClass = (locale: string) => {
    switch (locale) {
      case 'ar':
        return 'font-arabic'
      case 'he':
        return 'font-hebrew'
      case 'zh':
        return 'font-chinese'
      case 'ug':
        return 'font-uyghur'
      default:
        return 'font-sans'
    }
  }

  return (
    <Component className={cn(getFontClass(locale), className)}>
      {children}
    </Component>
  )
}

// Hook to get language-specific font class
export function useLanguageFont() {
  const locale = useLocale()

  return {
    fontClass:
      locale === 'ar'
        ? 'font-arabic'
        : locale === 'he'
          ? 'font-hebrew'
          : locale === 'zh'
            ? 'font-chinese'
            : locale === 'ug'
              ? 'font-uyghur'
              : 'font-sans',
    locale,
  }
}
