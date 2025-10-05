/**
 * CSP Nonce utilities.
 * Generates a per-request nonce and provides helper to build CSP header value.
 */
import { randomBytes } from 'crypto'

export interface CSPContext {
  nonce: string
}

// Simple in-memory WeakMap associating request (or a symbol key) to nonce.
// For middleware we attach nonce to request headers for propagation.

const NONCE_HEADER = 'x-csp-nonce'

export function generateNonce(bytes = 16): string {
  return randomBytes(bytes).toString('base64')
}

export function attachNonceHeader(headers: Headers, nonce: string) {
  headers.set(NONCE_HEADER, nonce)
}

export function extractNonceHeader(headers: Headers): string | undefined {
  return headers.get(NONCE_HEADER) || undefined
}

export function buildCSP(nonce: string) {
  // Baseline CSP; in production we stay strict (nonce + self), in development we relax
  // to support Turbopack/Next dev tools (inline styles, eval, blobs, and websockets).
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) {
    // Allow dev server HMR and style/script injection patterns
    // Replace nonce-based lists with permissive dev lists (do NOT include nonce in dev)
    directives['script-src'] = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'blob:',
      'http:',
      'https:',
    ]
    directives['script-src-elem'] = [...directives['script-src']]
    directives['style-src'] = [
      "'self'",
      "'unsafe-inline'",
      'blob:',
      'http:',
      'https:',
      'https://fonts.googleapis.com',
    ]
    directives['style-src-elem'] = [...directives['style-src']]
    // Allow inline style attributes in dev if libraries inject them
    directives['style-src-attr'] = ["'unsafe-inline'"]
    directives['connect-src'] = ["'self'", 'ws:', 'wss:', 'http:', 'https:']
    // Some dev tools may create blob: URLs for styles or images
    directives['img-src'].push('blob:')
    // Allow Google Fonts hosts for fonts
    directives['font-src'].push('https://fonts.gstatic.com')
    // Workers in dev may require blob: sources
    directives['worker-src'] = ["'self'", 'blob:']
  } else {
    // Production: strict nonce-based policy; allow Google Fonts if used via <link>
    directives['style-src-elem'] = ["'self'", 'https://fonts.googleapis.com']
    directives['script-src-elem'] = [...directives['script-src']]
    directives['font-src'].push('https://fonts.gstatic.com')
  }
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}

export function applyNonceToInlineHtml(html: string, nonce: string) {
  // Basic replacement pattern for <script> and <style> tags without existing nonce
  return html
    .replace(/<script(?![^>]*nonce=)/g, `<script nonce="${nonce}"`)
    .replace(/<style(?![^>]*nonce=)/g, `<style nonce="${nonce}"`)
}

export { NONCE_HEADER }
