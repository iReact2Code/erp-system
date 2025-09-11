import { UserRole } from '@/lib/prisma-mock'

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: UserRole
  }
}
