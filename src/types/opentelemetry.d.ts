// Ambient module declarations for optional OpenTelemetry imports when types are not yet installed or tracing disabled.
// These are intentionally minimal to avoid compile errors without enforcing full type safety.

declare module '@opentelemetry/api' {
  export const diag: { setLogger: (...args: unknown[]) => void }
  export class DiagConsoleLogger {}
  export enum DiagLogLevel {
    ERROR,
  }
  export namespace trace {
    function getActiveSpan(): { spanContext(): { traceId: string } } | undefined
  }
}

declare module '@opentelemetry/sdk-node' {
  export class NodeSDK {
    constructor(opts: unknown)
    start(): Promise<void>
    shutdown(): Promise<void>
  }
}

declare module '@opentelemetry/exporter-trace-otlp-http' {
  export class OTLPTraceExporter {
    constructor(opts?: Record<string, unknown>)
  }
}

declare module '@opentelemetry/auto-instrumentations-node' {
  export function getNodeAutoInstrumentations(): unknown
}
