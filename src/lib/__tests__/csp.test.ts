import { buildCSP, generateNonce, applyNonceToInlineHtml } from '../csp'

describe('CSP nonce utilities', () => {
  it('generates base64 nonce', () => {
    const n = generateNonce()
    expect(n).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('builds CSP with provided nonce', () => {
    const n = 'abc123'
    const csp = buildCSP(n)
    expect(csp).toContain(`script-src 'self' 'nonce-${n}'`)
    expect(csp).toContain(`style-src 'self' 'nonce-${n}'`)
  })

  it('injects nonce attributes into inline tags', () => {
    const html =
      '<html><head><script>console.log(1)</script><style>body{}</style></head></html>'
    const out = applyNonceToInlineHtml(html, 'XYZ')
    expect(out).toContain('<script nonce="XYZ">')
    expect(out).toContain('<style nonce="XYZ">')
  })
})
