'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserCheck, Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUsers, useDeleteUser } from '@/features/users/hooks'
import { TableLoading } from '@/components/ui/loading'
import { ApiErrorDisplay } from '@/components/ui/error-boundary'

export function UsersTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')
  const tUsers = useTranslations('users')
  const tNav = useTranslations('navigation')

  const { data: users, loading, error, refresh } = useUsers()
  const deleteUser = useDeleteUser()

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    const result = await deleteUser.mutate(id)
    if (result.success) {
      refresh()
    }
  }

  const filteredUsers = (users || []).filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">{tUsers('admin') || 'Admin'}</Badge>
      case 'MANAGER':
        return (
          <Badge variant="default" className="bg-blue-500">
            {tUsers('manager') || 'Manager'}
          </Badge>
        )
      case 'USER':
        return <Badge variant="secondary">{tUsers('user') || 'User'}</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <CardTitle>{tUsers('title')}</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <UserCheck className="h-4 w-4" />
            <span>
              {filteredUsers.length} {t('users')}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deleteUser.error}
          onDismiss={() => deleteUser.reset()}
        />

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchUsers')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <TableLoading rows={5} columns={4} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tNav('name')}</TableHead>
                <TableHead>{tUsers('email')}</TableHead>
                <TableHead>{tNav('role')}</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteUser.loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchTerm ? t('noUsersFound') : t('noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
