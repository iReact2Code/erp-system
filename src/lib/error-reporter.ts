import { serializeError } from '@/lib/logger'
import { getCurrentRequestContext } from '@/lib/observability/async-context'

export interface ErrorReport {
  message: string
  name?: string
  stack?: string
  requestId?: string
  traceId?: string
  timestamp: string
  meta?: Record<string, unknown>
}

export interface ErrorReporter {
  report: (err: unknown, meta?: Record<string, unknown>) => void
}

// Default no-op reporter (can be swapped via setErrorReporter)
let activeReporter: ErrorReporter = {
  report: () => {
    /* noop */
  },
}

export function setErrorReporter(rep: ErrorReporter) {
  activeReporter = rep
}

export function reportError(err: unknown, meta?: Record<string, unknown>) {
  try {
    const ctx = getCurrentRequestContext()
    let base: ErrorReport = {
      message:
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err),
      name: err instanceof Error ? err.name : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      requestId: ctx?.requestId,
      traceId: ctx?.traceId,
      timestamp: new Date().toISOString(),
      meta,
    }
    // Ensure serialization safety
    base = {
      ...base,
      meta: meta
        ? (serializeError(meta) as Record<string, unknown>)
        : undefined,
    }
    activeReporter.report(base)
  } catch {
    // swallow any reporting failure
  }
}
