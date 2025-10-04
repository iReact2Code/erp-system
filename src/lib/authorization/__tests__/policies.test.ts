import {
  can,
  requirePermission,
  AuthorizationError,
  listRolePermissions,
  allActions,
} from '@/lib/authorization/policies'

const mockUser = (role?: string) => ({ id: 'u1', role })

describe('authorization policies', () => {
  test('can() allows ADMIN inventory:create', () => {
    expect(can(mockUser('ADMIN'), 'inventory:create')).toBe(true)
  })

  test('can() denies THIRD_PARTY_CLIENT inventory:create', () => {
    expect(can(mockUser('THIRD_PARTY_CLIENT'), 'inventory:create')).toBe(false)
  })

  test('requirePermission throws for denied action', () => {
    expect(() =>
      requirePermission(mockUser('THIRD_PARTY_CLIENT'), 'inventory:create')
    ).toThrow(AuthorizationError)
  })

  test('listRolePermissions returns non-empty for ADMIN', () => {
    const perms = listRolePermissions('ADMIN')
    expect(perms.length).toBeGreaterThan(0)
  })

  test('allActions contains inventory:read', () => {
    expect(allActions()).toContain('inventory:read')
  })
})
