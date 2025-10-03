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
  // Restrictive baseline; allow scripts/styles with this nonce, plus self.
  // Remove unsafe-inline/eval now that we use nonce (if specific libs need eval consider separate hash allowances).
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
