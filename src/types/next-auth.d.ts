declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: 'CLERK' | 'SUPERVISOR' | 'THIRD_PARTY_CLIENT'
  }
}
