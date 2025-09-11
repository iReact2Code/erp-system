import { Geist, Geist_Mono } from 'next/font/google'

// Base fonts for Latin scripts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Language-specific font configurations
export const fontConfig = {
  // Default fonts for English and other Latin scripts
  en: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
  },
  es: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
  },
  fr: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
  },
  // Arabic fonts
  ar: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
    // Add Arabic font family to CSS
    fontFamily:
      'var(--font-geist-sans), "Noto Sans Arabic", "Arial Unicode MS", sans-serif',
  },
  // Hebrew fonts
  he: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
    fontFamily:
      'var(--font-geist-sans), "Noto Sans Hebrew", "Arial Unicode MS", sans-serif',
  },
  // Chinese fonts
  zh: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
    fontFamily:
      'var(--font-geist-sans), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  // Uyghur fonts - UKIJ Tuz Tor
  ug: {
    sans: geistSans,
    mono: geistMono,
    className: `${geistSans.variable} ${geistMono.variable}`,
    fontFamily:
      '"UKIJ Tuz Tor", "UKIJ Tuz", "UKIJ Tuz Kitab", var(--font-geist-sans), sans-serif',
  },
} as const

export type SupportedLocale = keyof typeof fontConfig

export function getFontConfig(locale: string) {
  return fontConfig[locale as SupportedLocale] || fontConfig.en
}
