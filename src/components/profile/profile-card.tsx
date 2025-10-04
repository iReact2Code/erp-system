'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Email from '@/components/ui/email'

export function ProfileCard() {
  const tUsers = useTranslations('users')
  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('auth-token')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="text-muted-foreground">
              Please log in to view your profile.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPERVISOR':
        return 'default'
      case 'CLERK':
        return 'secondary'
      case 'THIRD_PARTY_CLIENT':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-muted-foreground [direction:ltr]">
                  <Email>{user.email}</Email>
                </p>
              </div>
              <Badge variant={getRoleBadgeVariant(user.role || '')}>
                {user.role?.replace('_', ' ') || 'Unknown Role'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Email Address</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold [direction:ltr]">
              <Email>{user.email}</Email>
            </div>
            <p className="text-xs text-muted-foreground">
              Your primary email address
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Account Role</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {user.role?.replace('_', ' ') || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Your access level in the system
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Account Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sign In</span>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge variant="default">{tUsers('active')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
