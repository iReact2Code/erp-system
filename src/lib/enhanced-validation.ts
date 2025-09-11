import { z } from 'zod'

/**
 * Enhanced security validation schemas with advanced checks
 */

// SQL Injection prevention patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(--|\/\*|\*\/|;|'|"|`)/,
  /(\bOR\b|\bAND\b).*[=<>]/i,
]

// XSS prevention patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./,
  /~\//,
  /\/\.\./,
  /\.\.\\/,
  /%2e%2e/gi,
  /%c0%af/gi,
]

/**
 * Safe string validation with security checks
 */
export const safeStringSchema = (maxLength: number = 255) =>
  z
    .string()
    .max(maxLength, `String must not exceed ${maxLength} characters`)
    .refine(
      val => !SQL_INJECTION_PATTERNS.some(pattern => pattern.test(val)),
      'Invalid characters detected'
    )
    .refine(
      val => !XSS_PATTERNS.some(pattern => pattern.test(val)),
      'Invalid content detected'
    )
    .refine(
      val => !PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(val)),
      'Invalid path characters detected'
    )

/**
 * Enhanced email validation with additional security checks
 */
export const secureEmailSchema = z
  .string()
  .email('Invalid email format')
  .min(3, 'Email must be at least 3 characters')
  .max(320, 'Email must not exceed 320 characters') // RFC 5321 limit
  .refine(email => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\+.*\+/, // Multiple + signs
      /\.{2,}/, // Multiple consecutive dots
      /@.*@/, // Multiple @ signs
      /^\./, // Starting with dot
      /\.$/, // Ending with dot
    ]
    return !suspiciousPatterns.some(pattern => pattern.test(email))
  }, 'Invalid email format detected')
  .refine(email => {
    // Validate domain part
    const [, domain] = email.split('@')
    return domain && domain.length <= 253 && !/^-|-$/.test(domain)
  }, 'Invalid email domain')

/**
 * Enhanced password validation with security requirements
 */
export const securePasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters') // Increased from 8
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    password =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        password
      ),
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .refine(
    password => !/(.)\1{2,}/.test(password),
    'Password cannot contain more than 2 consecutive identical characters'
  )
  .refine(password => {
    // Common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /12345/,
    ]
    return !weakPatterns.some(pattern => pattern.test(password))
  }, 'Password contains common weak patterns')

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .refine(
      name => !PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(name)),
      'Invalid filename'
    )
    .refine(
      name => !/[<>:"|*?\\\/]/.test(name),
      'Filename contains invalid characters'
    ),
  size: z
    .number()
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  type: z.string().refine(type => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    return allowedTypes.includes(type)
  }, 'File type not allowed'),
})

/**
 * URL validation with security checks
 */
export const secureUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Only allow HTTP and HTTPS
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'Only HTTP and HTTPS URLs are allowed')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Block localhost and private networks in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname
        return !(
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
        )
      }
      return true
    } catch {
      return false
    }
  }, 'Private network URLs not allowed')

/**
 * Phone number validation
 */
export const phoneSchema = z
  .string()
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .refine(phone => {
    // Remove non-digits and check length
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }, 'Invalid phone number length')

/**
 * Enhanced pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(
      z
        .number()
        .min(1, 'Page must be at least 1')
        .max(10000, 'Page number too large')
    ),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .pipe(
      z
        .number()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
    ),
  sortBy: safeStringSchema(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  search: safeStringSchema(200).optional(),
})

/**
 * Search query validation
 */
export const searchSchema = z.object({
  q: safeStringSchema(200)
    .min(1, 'Search query required')
    .refine(query => query.trim().length >= 1, 'Search query cannot be empty')
    .refine(query => {
      // Prevent regex denial of service
      const suspiciousRegexPatterns = [
        /\(\?\#/, // Comments
        /\(\?\:/, // Non-capturing groups with excessive nesting
        /\*\+/, // Catastrophic backtracking patterns
        /\+\*/, // Catastrophic backtracking patterns
      ]
      return !suspiciousRegexPatterns.some(pattern => pattern.test(query))
    }, 'Invalid search pattern'),
  filters: z.record(z.string(), safeStringSchema(100)).optional(),
})

/**
 * API key validation
 */
export const apiKeySchema = z
  .string()
  .min(32, 'API key too short')
  .max(128, 'API key too long')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Invalid API key format')

/**
 * Timestamp validation
 */
export const timestampSchema = z
  .string()
  .datetime('Invalid timestamp format')
  .refine(timestamp => {
    const date = new Date(timestamp)
    const now = new Date()
    const oneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate()
    )
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    )

    return date >= oneYearAgo && date <= oneYearFromNow
  }, 'Timestamp must be within reasonable range')

/**
 * Enhanced request metadata validation
 */
export const requestMetadataSchema = z.object({
  userAgent: safeStringSchema(500).optional(),
  acceptLanguage: safeStringSchema(100).optional(),
  timezone: z
    .string()
    .max(50)
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, 'Invalid timezone format')
    .optional(),
  fingerprint: z.string().max(128).optional(),
})

/**
 * Bulk operation validation
 */
export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'At least one item required')
    .max(100, 'Cannot process more than 100 items at once'),
})

/**
 * Export all enhanced schemas
 */
export const enhancedValidationSchemas = {
  safeString: safeStringSchema,
  secureEmail: secureEmailSchema,
  securePassword: securePasswordSchema,
  fileUpload: fileUploadSchema,
  secureUrl: secureUrlSchema,
  phone: phoneSchema,
  pagination: paginationSchema,
  search: searchSchema,
  apiKey: apiKeySchema,
  timestamp: timestampSchema,
  requestMetadata: requestMetadataSchema,
  bulkOperation: bulkOperationSchema,
}
