import bcrypt from 'bcryptjs'
import { passwordSchema } from '@/types/validation'

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  try {
    passwordSchema.parse(password)
    return { isValid: true, errors: [] }
  } catch {
    return {
      isValid: false,
      errors: ['Password does not meet security requirements'],
    }
  }
}

// Hash password securely
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // High security salt rounds
  return await bcrypt.hash(password, saltRounds)
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

// Generate secure random password
export function generateSecurePassword(length: number = 16): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&'
  let password = ''

  // Ensure at least one character from each required category
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '@$!%*?&'

  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Shuffle the password to randomize character positions
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

// Generate secure token for password reset
export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Check if password has been compromised (simplified check)
export function checkCommonPasswords(password: string): boolean {
  const commonPasswords = [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'Password1',
    'password1',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'iloveyou',
    'princess',
  ]

  return commonPasswords.includes(password.toLowerCase())
}

// Password entropy calculation
export function calculatePasswordEntropy(password: string): number {
  let charset = 0

  if (/[a-z]/.test(password)) charset += 26
  if (/[A-Z]/.test(password)) charset += 26
  if (/[0-9]/.test(password)) charset += 10
  if (/[^A-Za-z0-9]/.test(password)) charset += 32 // Estimated special characters

  return Math.log2(Math.pow(charset, password.length))
}

// Password strength score (0-4)
export function getPasswordStrengthScore(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters long')

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push('Include special characters')

  // Additional checks
  if (password.length >= 12) score += 1
  if (calculatePasswordEntropy(password) >= 50) score += 1
  if (!checkCommonPasswords(password)) score += 1
  else feedback.push('Avoid common passwords')

  // Cap score at 4
  score = Math.min(score, 4)

  return { score, feedback }
}

// Secure password comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Session token generation
export function generateSessionToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let token = ''
  for (let i = 0; i < 128; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// API key generation
export function generateAPIKey(): string {
  const prefix = 'erp_'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = prefix
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}
