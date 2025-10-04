import { can, requirePermission } from '../authorization/policies'

describe('diagnostics:read action', () => {
  const action = 'diagnostics:read' as const

  test('ADMIN can diagnostics:read', () => {
    expect(can({ role: 'ADMIN' }, action)).toBe(true)
    expect(() => requirePermission({ role: 'ADMIN' }, action)).not.toThrow()
  })

  test('MANAGER cannot diagnostics:read', () => {
    expect(can({ role: 'MANAGER' }, action)).toBe(false)
    expect(() => requirePermission({ role: 'MANAGER' }, action)).toThrow()
  })

  test('anonymous cannot diagnostics:read', () => {
    expect(can(null, action)).toBe(false)
    expect(() => requirePermission(null, action)).toThrow()
  })
})
