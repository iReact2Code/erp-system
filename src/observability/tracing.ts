// OpenTelemetry imports are optional; wrap in try/catch to avoid runtime crash if deps missing.
let otelAvailable = true
let diag: typeof import('@opentelemetry/api').diag
let DiagConsoleLogger: any
let DiagLogLevel: any
let NodeSDK: any
let OTLPTraceExporter: any
let getNodeAutoInstrumentations: any
try {
  ;({ diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api'))
  ;({ NodeSDK } = require('@opentelemetry/sdk-node'))
  ;({ OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http'))
  ;({
    getNodeAutoInstrumentations,
  } = require('@opentelemetry/auto-instrumentations-node'))
} catch {
  otelAvailable = false
}

let initialized = false

export function initTracing() {
  if (initialized) return
  if (!otelAvailable) return
  if (process.env.ENABLE_TRACING !== '1') return

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

  const serviceName = process.env.SERVICE_NAME || 'ai-erp-system'
  const exporter = new OTLPTraceExporter({
    // OTLP endpoint override via OTEL_EXPORTER_OTLP_ENDPOINT (standard) or custom env
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  })

  const sdk = new NodeSDK({
    traceExporter: exporter,
    serviceName,
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk
    .start()
    .then(() => {
      console.log('[tracing] OpenTelemetry initialized')
      initialized = true
    })
    .catch((err: unknown) => {
      console.error('[tracing] initialization failed', err)
    })

  // Ensure flush on shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown().catch(() => {
      /* ignore */
    })
  })
}

// Auto-init when module imported in server context
if (typeof window === 'undefined') {
  initTracing()
}
