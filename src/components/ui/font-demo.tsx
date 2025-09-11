'use client'

import { useLocale } from 'next-intl'
import { LanguageFont } from './language-font'

export function FontDemo() {
  const locale = useLocale()

  const sampleTexts = {
    en: 'Hello, this is English text with Geist font',
    es: 'Hola, este es texto en español con fuente Geist',
    fr: 'Bonjour, ceci est du texte français avec la police Geist',
    ar: 'مرحبا، هذا نص عربي مع خط Noto Sans Arabic',
    he: 'שלום, זה טקסט עברי עם גופן Noto Sans Hebrew',
    zh: '你好，这是中文文本，使用思源黑体字体',
    ug: 'ياخشىمۇسىز، بۇ ئۇيغۇرچە تېكىست، UKIJ Tuz Tor خەت نۇسخىسى بىلەن',
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Language-Specific Font Demo</h2>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Current Locale: {locale}</h3>
        <LanguageFont className="text-lg p-4 border rounded-lg bg-muted">
          {sampleTexts[locale as keyof typeof sampleTexts] || sampleTexts.en}
        </LanguageFont>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">All Languages Preview:</h3>
        <div className="space-y-2">
          {Object.entries(sampleTexts).map(([lang, text]) => (
            <div key={lang} className="p-3 border rounded">
              <div className="text-sm text-muted-foreground mb-1">
                {lang.toUpperCase()}
              </div>
              <div
                className={`font-${
                  lang === 'ar'
                    ? 'arabic'
                    : lang === 'he'
                      ? 'hebrew'
                      : lang === 'zh'
                        ? 'chinese'
                        : lang === 'ug'
                          ? 'uyghur'
                          : 'sans'
                }`}
              >
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
