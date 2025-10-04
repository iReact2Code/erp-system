/**
 * Lightweight feature flag system supporting three sources (precedence high -> low):
 * 1. Environment variables (e.g. FLAG_SOME_FEATURE=true)
 * 2. Runtime JSON registry (mutable in-process for experiments / tests)
 * 3. Default map (static fallbacks)
 *
 * All flags are booleans; extend shape if needed later.
 */

import { createLogger } from './logger'

const log = createLogger('feature-flags')

// Default flag values (safe fallbacks)
const defaultFlags: Record<string, boolean> = {
  experimentalCaching: false,
  optimizedApiClient: true,
  newDashboardWidgets: false,
}

// Normalized defaults (keys lowercased with underscores removed per normalize())
const normalizedDefaultFlags: Record<string, boolean> = Object.fromEntries(
  Object.entries(defaultFlags).map(([k, v]) => [normalize(k), v])
)

// In-memory runtime overrides (mutable)
const runtimeFlags: Record<string, boolean> = {}

// Environment variable prefix
const ENV_PREFIX = 'FLAG_'

function readEnvFlags(): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(ENV_PREFIX)) {
      const flagName = key.substring(ENV_PREFIX.length)
      result[normalize(flagName)] = normalizeBoolean(value)
    }
  }
  return result
}

function normalize(name: string) {
  // Normalize to a compact lowercased key: remove underscores, hyphens, and whitespace
  return name.replace(/[\s_\-]/g, '').toLowerCase()
}

function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    return ['1', 'true', 'on', 'yes', 'enabled'].includes(val.toLowerCase())
  }
  return false
}

export interface FlagEvaluationOptions {
  default?: boolean // ad-hoc default when not in defaultFlags
  trace?: boolean // force logging for this evaluation
}

export function isFlagEnabled(
  name: string,
  options: FlagEvaluationOptions = {}
): boolean {
  const key = normalize(name)
  const env = readEnvFlags()
  const sources: { source: string; value: boolean | undefined }[] = [
    { source: 'env', value: env[key] },
    { source: 'runtime', value: runtimeFlags[key] },
    {
      source: 'defaults',
      value: normalizedDefaultFlags[key] ?? options.default,
    },
  ]
  for (const s of sources) {
    if (typeof s.value === 'boolean') {
      if (options.trace) {
        log.debug('flag evaluation', {
          flag: key,
          resolvedFrom: s.source,
          value: s.value,
        })
      }
      return s.value
    }
  }
  if (options.trace) {
    log.debug('flag evaluation fallback false', { flag: key })
  }
  return false
}

export function setRuntimeFlag(name: string, value: boolean) {
  const key = normalize(name)
  runtimeFlags[key] = value
  log.info('runtime flag set', { flag: key, value })
}

export function clearRuntimeFlag(name: string) {
  const key = normalize(name)
  delete runtimeFlags[key]
  log.info('runtime flag cleared', { flag: key })
}

export function listFlags() {
  const env = readEnvFlags()
  const keys = new Set([
    ...Object.keys(normalizedDefaultFlags),
    ...Object.keys(env),
    ...Object.keys(runtimeFlags),
  ])
  const summary: Record<string, { value: boolean; source: string }> = {}
  for (const k of keys) {
    if (k in env) summary[k] = { value: env[k], source: 'env' }
    else if (k in runtimeFlags)
      summary[k] = { value: runtimeFlags[k], source: 'runtime' }
    else summary[k] = { value: normalizedDefaultFlags[k], source: 'defaults' }
  }
  return summary
}

// Convenience helper for conditional component or logic loading
export function whenFlag<T>(flag: string, on: () => T, off: () => T): T {
  return isFlagEnabled(flag) ? on() : off()
}

export type FeatureFlagsSummary = ReturnType<typeof listFlags>
