// Locale-aware currency formatter utility
// Usage: formatCurrency(1234.56, locale) or formatCurrency(1234.56, locale, 'EUR')

const DEFAULT_CURRENCY_BY_LOCALE: Record<string, string> = {
  en: 'USD',
  tr: 'TRY',
  fr: 'EUR',
  es: 'EUR',
  ar: 'SAR',
  he: 'ILS',
  zh: 'CNY',
  ug: 'CNY',
}

export function formatCurrency(
  amount: number,
  locale: string = 'en',
  currency?: string
): string {
  const cur = currency || DEFAULT_CURRENCY_BY_LOCALE[locale] || 'USD'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
    }).format(amount)
  } catch {
    // Fallback: use en-US formatting if the provided locale/currency is invalid
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
}
