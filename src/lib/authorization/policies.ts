import { createLogger } from '@/lib/logger'
import { UserRole } from '@/lib/prisma-mock'
import { serializeError } from '@/lib/logger'

const authzLog = createLogger('authz')

// Actions are coarse-grained; can be refined per-resource with conditions later
export type Action =
  | 'inventory:create'
  | 'inventory:update'
  | 'inventory:delete'
  | 'inventory:read'
  | 'user:list'
  | 'order:create'
  | 'order:update'
  | 'order:read'
  | 'order:delete'
  | 'diagnostics:read'

export interface UserLike {
  id?: string
  role?: UserRole | string
  email?: string
}

// Role to allowed actions mapping
// NOTE: THIRD_PARTY_CLIENT intentionally limited
const ROLE_ACTIONS: Record<string, Action[]> = {
  ADMIN: [
    'inventory:create',
    'inventory:update',
    'inventory:delete',
    'inventory:read',
    'user:list',
    'order:create',
    'order:update',
    'order:read',
    'order:delete',
    'diagnostics:read',
  ],
  MANAGER: [
    'inventory:create',
    'inventory:update',
    'inventory:read',
    'user:list', // managers can see users? adjust if necessary
    'order:create',
    'order:update',
    'order:read',
  ],
  SUPERVISOR: ['inventory:read', 'user:list', 'order:read'],
  THIRD_PARTY_CLIENT: ['order:read'],
}

export function can(
  user: UserLike | null | undefined,
  action: Action
): boolean {
  if (!user || !user.role) return false
  const list = ROLE_ACTIONS[user.role] || []
  return list.includes(action)
}

export class AuthorizationError extends Error {
  action: Action
  constructor(action: Action, message?: string) {
    super(message || 'Forbidden')
    this.name = 'AuthorizationError'
    this.action = action
  }
}

interface RequirePermissionOptions {
  audit?: (info: { user: UserLike | null | undefined; action: Action }) => void
  silent?: boolean
}

export function requirePermission(
  user: UserLike | null | undefined,
  action: Action,
  opts: RequirePermissionOptions = {}
) {
  if (can(user, action)) return true
  try {
    if (opts.audit) {
      opts.audit({ user, action })
    }
  } catch (e) {
    authzLog.warn('audit_hook_failed', { error: serializeError(e) })
  }
  if (!opts.silent) {
    authzLog.info('denied', { action, role: user?.role, userId: user?.id })
  }
  throw new AuthorizationError(action)
}

export function listRolePermissions(role: string): Action[] {
  return ROLE_ACTIONS[role] ? [...ROLE_ACTIONS[role]] : []
}

export function allActions(): Action[] {
  const set = new Set<Action>()
  Object.values(ROLE_ACTIONS).forEach(arr => arr.forEach(a => set.add(a)))
  return [...set]
}
