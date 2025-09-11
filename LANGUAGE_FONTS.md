# Language-Specific Fonts

This project supports different fonts for different languages to provide optimal typography for each script.

## Supported Languages and Fonts

| Language | Locale | Font Family      | Source         |
| -------- | ------ | ---------------- | -------------- |
| English  | `en`   | Geist Sans       | Google Fonts   |
| Spanish  | `es`   | Geist Sans       | Google Fonts   |
| French   | `fr`   | Geist Sans       | Google Fonts   |
| Arabic   | `ar`   | Noto Sans Arabic | Google Fonts   |
| Hebrew   | `he`   | Noto Sans Hebrew | Google Fonts   |
| Chinese  | `zh`   | Noto Sans SC     | Google Fonts   |
| Uyghur   | `ug`   | UKIJ Tuz Tor     | UKIJ Fonts CDN |

## Usage

### Automatic Font Application

Fonts are automatically applied based on the current locale. The layout component (`src/app/[locale]/layout.tsx`) handles font loading and application.

### Using the LanguageFont Component

```tsx
import { LanguageFont } from '@/components/ui/language-font'

function MyComponent() {
  return (
    <LanguageFont className="text-lg">
      This text will use the appropriate font for the current locale
    </LanguageFont>
  )
}
```

### Using Tailwind Classes

You can also use Tailwind classes directly:

```tsx
// Arabic text
<div className="font-arabic">نص عربي</div>

// Hebrew text
<div className="font-hebrew">טקסט עברי</div>

// Chinese text
<div className="font-chinese">中文文本</div>

// Uyghur text
<div className="font-uyghur">ئۇيغۇرچە تېكىست</div>
```

### Using the Hook

```tsx
import { useLanguageFont } from '@/components/ui/language-font'

function MyComponent() {
  const { fontClass, locale } = useLanguageFont()

  return <div className={fontClass}>Text with language-specific font</div>
}
```

## Font Configuration

The font configuration is managed in `src/lib/font-config.ts`. To add a new language:

1. Add the language to the `fontConfig` object
2. Add font loading in the layout component
3. Add Tailwind font family in `tailwind.config.js`
4. Update the `LanguageFont` component if needed

## Font Loading

- **Google Fonts**: Automatically loaded via Google Fonts API
- **UKIJ Tuz Tor**: Loaded from UKIJ Fonts CDN for Uyghur language
- **Fallbacks**: Each font family includes appropriate fallbacks

## Performance Considerations

- Fonts are only loaded for the current locale
- Preconnect headers are used for faster font loading
- Font display is optimized for better performance

## RTL Support

RTL languages (Arabic, Hebrew, Uyghur) automatically get:

- `dir="rtl"` attribute
- RTL-specific CSS classes
- Optimized font rendering for RTL scripts

## Testing

Use the `FontDemo` component to test all language fonts:

```tsx
import { FontDemo } from '@/components/ui/font-demo'

// Add to any page to see font previews
;<FontDemo />
```
