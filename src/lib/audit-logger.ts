import { UserRole } from '@/lib/prisma-mock'
import { createLogger } from '@/lib/logger'

// Scoped logger for audit events
const auditLog = createLogger('audit')

// Audit event types
export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'INVENTORY_CREATED'
  | 'INVENTORY_UPDATED'
  | 'INVENTORY_DELETED'
  | 'SALE_CREATED'
  | 'SALE_UPDATED'
  | 'SALE_CANCELLED'
  | 'PURCHASE_CREATED'
  | 'PURCHASE_APPROVED'
  | 'PURCHASE_REJECTED'
  | 'PURCHASE_COMPLETED'
  | 'API_ACCESS'
  | 'SECURITY_VIOLATION'
  | 'DATA_EXPORT'
  | 'SYSTEM_ERROR'

// Audit log entry interface
export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  userId?: string
  userEmail?: string
  userRole?: UserRole
  ipAddress: string
  userAgent: string
  resourceType?: string
  resourceId?: string
  details: Record<string, unknown>
  success: boolean
  errorMessage?: string
}

// In-memory audit log (in production, use database)
const auditLogs: AuditLogEntry[] = []

// Create audit log entry
export function createAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): string {
  const logEntry: AuditLogEntry = {
    id: generateLogId(),
    timestamp: new Date(),
    ...entry,
  }

  auditLogs.push(logEntry)

  // Structured audit log
  auditLog.info(logEntry.eventType.toLowerCase(), {
    id: logEntry.id,
    userId: logEntry.userId,
    userEmail: logEntry.userEmail,
    userRole: logEntry.userRole,
    ipAddress: logEntry.ipAddress,
    resourceType: logEntry.resourceType,
    resourceId: logEntry.resourceId,
    success: logEntry.success,
    errorMessage: logEntry.errorMessage,
    details: logEntry.details,
    timestamp: logEntry.timestamp.toISOString(),
  })

  // In production, you would save to database here
  // await saveAuditLogToDatabase(logEntry);

  return logEntry.id
}

// Generate unique log ID
function generateLogId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Audit specific events
export function auditUserLogin(
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
) {
  return createAuditLog({
    eventType: 'USER_LOGIN',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success,
    errorMessage,
    details: {
      loginAttempt: true,
      timestamp: new Date().toISOString(),
    },
  })
}

export function auditUserLogout(
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string
) {
  return createAuditLog({
    eventType: 'USER_LOGOUT',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success: true,
    details: {
      logoutTime: new Date().toISOString(),
    },
  })
}

export function auditUserCreated(
  createdUserId: string,
  createdUserEmail: string,
  createdUserRole: UserRole,
  createdByUserId: string,
  createdByUserEmail: string,
  createdByUserRole: UserRole,
  ipAddress: string,
  userAgent: string
) {
  return createAuditLog({
    eventType: 'USER_CREATED',
    userId: createdByUserId,
    userEmail: createdByUserEmail,
    userRole: createdByUserRole,
    ipAddress,
    userAgent,
    resourceType: 'USER',
    resourceId: createdUserId,
    success: true,
    details: {
      createdUser: {
        id: createdUserId,
        email: createdUserEmail,
        role: createdUserRole,
      },
    },
  })
}

export function auditPasswordChanged(
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string,
  success: boolean
) {
  return createAuditLog({
    eventType: 'PASSWORD_CHANGED',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success,
    details: {
      changeTime: new Date().toISOString(),
    },
  })
}

export function auditInventoryAction(
  eventType: 'INVENTORY_CREATED' | 'INVENTORY_UPDATED' | 'INVENTORY_DELETED',
  inventoryId: string,
  inventoryName: string,
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string,
  changes?: Record<string, unknown>
) {
  return createAuditLog({
    eventType,
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    resourceType: 'INVENTORY',
    resourceId: inventoryId,
    success: true,
    details: {
      inventoryName,
      changes: changes || {},
    },
  })
}

export function auditSaleAction(
  eventType: 'SALE_CREATED' | 'SALE_UPDATED' | 'SALE_CANCELLED',
  saleId: string,
  saleTotal: number,
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string,
  changes?: Record<string, unknown>
) {
  return createAuditLog({
    eventType,
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    resourceType: 'SALE',
    resourceId: saleId,
    success: true,
    details: {
      saleTotal,
      changes: changes || {},
    },
  })
}

export function auditPurchaseAction(
  eventType:
    | 'PURCHASE_CREATED'
    | 'PURCHASE_APPROVED'
    | 'PURCHASE_REJECTED'
    | 'PURCHASE_COMPLETED',
  purchaseId: string,
  purchaseTotal: number,
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string,
  changes?: Record<string, unknown>
) {
  return createAuditLog({
    eventType,
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    resourceType: 'PURCHASE',
    resourceId: purchaseId,
    success: true,
    details: {
      purchaseTotal,
      changes: changes || {},
    },
  })
}

export function auditSecurityViolation(
  violationType: string,
  userId: string | undefined,
  userEmail: string | undefined,
  userRole: UserRole | undefined,
  ipAddress: string,
  userAgent: string,
  details: Record<string, unknown>
) {
  return createAuditLog({
    eventType: 'SECURITY_VIOLATION',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success: false,
    details: {
      violationType,
      ...details,
    },
  })
}

export function auditAPIAccess(
  endpoint: string,
  method: string,
  userId: string | undefined,
  userEmail: string | undefined,
  userRole: UserRole | undefined,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  responseStatus: number,
  responseTime: number
) {
  return createAuditLog({
    eventType: 'API_ACCESS',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success,
    details: {
      endpoint,
      method,
      responseStatus,
      responseTime,
    },
  })
}

export function auditDataExport(
  exportType: string,
  recordCount: number,
  userId: string,
  userEmail: string,
  userRole: UserRole,
  ipAddress: string,
  userAgent: string
) {
  return createAuditLog({
    eventType: 'DATA_EXPORT',
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    success: true,
    details: {
      exportType,
      recordCount,
      exportTime: new Date().toISOString(),
    },
  })
}

// Query audit logs
export function getAuditLogs(filters: {
  eventType?: AuditEventType
  userId?: string
  startDate?: Date
  endDate?: Date
  success?: boolean
  limit?: number
}): AuditLogEntry[] {
  let filteredLogs = [...auditLogs]

  if (filters.eventType) {
    filteredLogs = filteredLogs.filter(
      log => log.eventType === filters.eventType
    )
  }

  if (filters.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
  }

  if (filters.startDate) {
    filteredLogs = filteredLogs.filter(
      log => log.timestamp >= filters.startDate!
    )
  }

  if (filters.endDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!)
  }

  if (filters.success !== undefined) {
    filteredLogs = filteredLogs.filter(log => log.success === filters.success)
  }

  // Sort by timestamp descending (newest first)
  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Apply limit
  if (filters.limit) {
    filteredLogs = filteredLogs.slice(0, filters.limit)
  }

  return filteredLogs
}

// Get audit statistics
export function getAuditStatistics(
  timeframe: 'day' | 'week' | 'month' = 'day'
): {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  uniqueUsers: number
  topEventTypes: { eventType: AuditEventType; count: number }[]
  securityViolations: number
} {
  const now = new Date()
  let startDate: Date

  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  const recentLogs = auditLogs.filter(log => log.timestamp >= startDate)

  const totalEvents = recentLogs.length
  const successfulEvents = recentLogs.filter(log => log.success).length
  const failedEvents = totalEvents - successfulEvents
  const uniqueUsers = new Set(recentLogs.map(log => log.userId).filter(Boolean))
    .size
  const securityViolations = recentLogs.filter(
    log => log.eventType === 'SECURITY_VIOLATION'
  ).length

  // Count event types
  const eventTypeCounts = recentLogs.reduce(
    (counts, log) => {
      counts[log.eventType] = (counts[log.eventType] || 0) + 1
      return counts
    },
    {} as Record<AuditEventType, number>
  )

  const topEventTypes = Object.entries(eventTypeCounts)
    .map(([eventType, count]) => ({
      eventType: eventType as AuditEventType,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalEvents,
    successfulEvents,
    failedEvents,
    uniqueUsers,
    topEventTypes,
    securityViolations,
  }
}
