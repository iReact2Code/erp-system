'use client'

// This provider is no longer needed since we switched to JWT authentication
// Keeping it as a simple wrapper to avoid breaking imports

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
