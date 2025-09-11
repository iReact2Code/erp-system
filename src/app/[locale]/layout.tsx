import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { getFontConfig } from '@/lib/font-config'
import type { Metadata } from 'next'

const locales = ['en', 'ug', 'es', 'fr', 'ar', 'he', 'zh'] as const
type Locale = (typeof locales)[number]

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
    other: {
      locale: locale,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound()

  // Providing all messages to the client side with the specific locale
  const messages = await getMessages({ locale })

  // Get language-specific font configuration
  const fontConfig = getFontConfig(locale)

  // Determine if the locale is RTL
  const isRTL = ['ar', 'he', 'ug'].includes(locale)

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={isRTL ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        {/* Load language-specific fonts */}
        {locale === 'ug' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap"
              rel="stylesheet"
            />
            {/* UKIJ Tuz font for Uyghur */}
            <link
              href="https://cdn.jsdelivr.net/gh/UKIJ/UKIJ-fonts@main/UKIJ-Tuz/UKIJ-Tuz.css"
              rel="stylesheet"
            />
          </>
        )}
        {locale === 'ar' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap"
              rel="stylesheet"
            />
          </>
        )}
        {locale === 'he' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100;200;300;400;500;600;700;800;900&display=swap"
              rel="stylesheet"
            />
          </>
        )}
        {locale === 'zh' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;200;300;400;500;600;700;800;900&display=swap"
              rel="stylesheet"
            />
          </>
        )}
      </head>
      <body
        className={`${fontConfig.className} antialiased`}
        style={{
          fontFamily: fontConfig.fontFamily || undefined,
        }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages} locale={locale}>
              {children}
            </NextIntlClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
