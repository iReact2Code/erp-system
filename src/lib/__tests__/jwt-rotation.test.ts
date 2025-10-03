import { issueAccessToken, verifyAccessToken } from '../jwt-auth'

describe('JWT dual-secret rotation', () => {
  const user = { id: 'u1', email: 'u@example.com', name: 'U', role: 'user' }
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('verifies tokens signed with current secret', () => {
    process.env.NEXTAUTH_SECRET = 'primary-secret'
    const token = issueAccessToken(user)
    expect(verifyAccessToken(token)).toMatchObject({ id: 'u1' })
  })

  test('verifies tokens signed with previous secret when rotated', () => {
    // Phase 1: old secret issues tokens
    process.env.NEXTAUTH_SECRET = 'old-secret'
    const oldToken = issueAccessToken(user)

    // Phase 2: rotate – new deploy with new secret + previous secret set
    process.env.NEXTAUTH_SECRET = 'new-secret'
    process.env.NEXTAUTH_SECRET_PREVIOUS = 'old-secret'

    // Old token still verifies under previous
    expect(verifyAccessToken(oldToken)).toMatchObject({ id: 'u1' })

    // New token signs with new secret, verifies normally
    const newToken = issueAccessToken(user)
    expect(verifyAccessToken(newToken)).toMatchObject({ id: 'u1' })
  })

  test('fails when previous secret not provided after rotation', () => {
    process.env.NEXTAUTH_SECRET = 'old-secret'
    const oldToken = issueAccessToken(user)

    // Rotate without setting previous secret var (misconfiguration)
    process.env.NEXTAUTH_SECRET = 'new-secret'
    delete process.env.NEXTAUTH_SECRET_PREVIOUS

    expect(verifyAccessToken(oldToken)).toBeNull()
  })
})
