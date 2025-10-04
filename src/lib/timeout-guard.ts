export interface TimeoutOptions {
  ms: number
  signal?: AbortSignal
  reason?: string
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Wrap a promise with an AbortController-based timeout. If the inner promise
 * supports abort (fetch / prisma with proper cancellation) it will receive the signal.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: TimeoutOptions
): Promise<T> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(
        new TimeoutError(
          opts.reason || `Operation timed out after ${opts.ms}ms`
        )
      )
    }, opts.ms)
  })
  const outerSignal = opts.signal
  function onOuterAbort() {
    controller.abort()
  }
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort()
    outerSignal.addEventListener('abort', onOuterAbort)
  }
  try {
    const result = await Promise.race([fn(controller.signal), timeoutPromise])
    return result as T
  } finally {
    clearTimeout(timeoutId!)
    if (outerSignal) outerSignal.removeEventListener('abort', onOuterAbort)
  }
}
