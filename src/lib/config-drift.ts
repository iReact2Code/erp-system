/*
  Config drift detector
  - Compares process.env keys to a canonical sample in .env.example.full
  - Logs warnings for missing or extra env vars
  - Non-fatal by design; intended to surface drift in logs/CI
*/
import fs from 'node:fs'
import path from 'node:path'

function parseEnvExample(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf8')
  const keys = new Set<string>()
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key] = trimmed.split('=')
    if (key && /^[A-Z0-9_]+$/.test(key)) keys.add(key)
  }
  return keys
}

export function reportConfigDrift(options?: {
  examplePath?: string
  ignoreExtra?: boolean
}) {
  try {
    const examplePath =
      options?.examplePath || path.join(process.cwd(), '.env.example.full')
    if (!fs.existsSync(examplePath)) return
    const expected = parseEnvExample(examplePath)
    const actualKeys = new Set(Object.keys(process.env))

    const missing: string[] = []
    const extra: string[] = []

    for (const key of expected) {
      if (!actualKeys.has(key)) missing.push(key)
    }

    // Helper: determine if an env var name is app-scoped (to reduce noise in drift reporting)
    const isAppScoped = (k: string) => {
      const upper = k.toUpperCase()
      const prefixes = [
        'NEXTAUTH_',
        'OTEL_',
        'FLAG_',
        'REDIS_',
        'CACHE_',
        'DATABASE_',
      ]
      const singles = [
        'ACCESS_TOKEN_TTL',
        'REFRESH_TOKEN_TTL',
        'ENABLE_TRACING',
      ]
      if (singles.includes(upper)) return true
      return prefixes.some(p => upper.startsWith(p))
    }

    for (const key of actualKeys) {
      // Always ignore very common system/process keys outright
      if (
        [
          'PATH',
          'PWD',
          'HOME',
          'SHELL',
          'TEMP',
          'TMP',
          'NODE',
          'NODE_OPTIONS',
          'NPM_CONFIG_CACHE',
          'NPM_CONFIG_GLOBALCONFIG',
          'NPM_COMMAND',
        ].includes(key.toUpperCase())
      )
        continue

      // Only consider extras that look app-scoped to avoid noisy Windows/macOS vars
      if (!expected.has(key) && isAppScoped(key)) {
        extra.push(key)
      }
    }

    // Only warn about extras if explicitly requested (ignoreExtra === false)
    if (missing.length || (extra.length && options?.ignoreExtra === false)) {
      console.warn('[CONFIG_DRIFT] Detected environment drift', {
        missing,
        extra,
      })
    } else {
      if (process.env.NODE_ENV === 'test') {
        console.log('[CONFIG_DRIFT] No drift detected')
      }
    }
  } catch (err) {
    console.warn(
      '[CONFIG_DRIFT] Drift detection failed:',
      (err as Error).message
    )
  }
}
