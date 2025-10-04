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

export function reportConfigDrift(options?: { examplePath?: string }) {
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

    for (const key of actualKeys) {
      // ignore typical system variables
      if (['PATH', 'PWD', 'HOME', 'SHELL', 'TEMP', 'TMP'].includes(key))
        continue
      if (!expected.has(key)) extra.push(key)
    }

    if (missing.length || extra.length) {
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
