'use client'

import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import useDebouncedValue from '@/hooks/use-debounced-value'
import type { User } from '@/types/api'
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
import { Email } from '@/components/ui/email'

export const UsersTable = memo(function UsersTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')
  const tUsers = useTranslations('users')
  const tNav = useTranslations('navigation')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const debouncedSearch = useDebouncedValue(searchTerm, 300)
  const {
    data: users,
    loading,
    error,
    refresh,
  } = useUsers({
    q: debouncedSearch,
    page,
    limit,
  })
  const usersArray: User[] = useMemo(() => {
    if (!users) return []
    if (Array.isArray(users)) return users as User[]
    if (typeof users === 'object' && 'data' in users) {
      return (users as { data: User[] }).data
    }
    return []
  }, [users])
  const deleteUser = useDeleteUser()

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('confirmDelete'))) return
      const result = await deleteUser.mutate(id)
      if (result.success) {
        refresh()
      }
    },
    [deleteUser, refresh, t]
  )

  // When a new debounced search term arrives, reset to page 1
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const filteredUsers = usersArray

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
            <Badge variant="outline" className="flex items-center space-x-1">
              <UserCheck className="h-4 w-4" />
              <span>
                {filteredUsers.length} {t('users')}
              </span>
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() =>
                alert(tUsers('invitePlaceholder') || 'Invite user')
              }
            >
              {tUsers('invite') || 'Invite'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deleteUser.error}
          onDismiss={() => deleteUser.reset()}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('searchUsers')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 w-80"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setPage(1)
              }}
            >
              {t('clear') || 'Clear'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {tUsers('listHelp') || ''}
          </div>
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
                <TableRow key={user.id} className="hover:bg-muted">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Email>{user.email}</Email>
                  </TableCell>
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
                    <div className="py-6">
                      <div className="text-lg font-medium">
                        {searchTerm ? t('noUsersFound') : t('noUsers')}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {tUsers('emptyHelp') ||
                          'Try adjusting your search or invite a new user.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {/* Pagination controls when API returns pagination info */}
        {users && typeof users === 'object' && 'pagination' in users && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-muted-foreground">Rows:</label>
              <select
                value={limit}
                onChange={e => {
                  setLimit(parseInt(e.target.value, 10))
                }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
                {'<<'}
              </Button>

              <Button
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>

              <div className="px-2 py-1 text-sm">
                {`Page ${page} of ${(users as { pagination: { pages: number } }).pagination.pages}`}
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground">Go to</label>
                <input
                  type="number"
                  min={1}
                  max={
                    (users as { pagination: { pages: number } }).pagination
                      .pages
                  }
                  value={page}
                  onChange={e =>
                    setPage(
                      Math.max(
                        1,
                        Math.min(
                          parseInt(e.target.value || '1', 10),
                          (users as { pagination: { pages: number } })
                            .pagination.pages
                        )
                      )
                    )
                  }
                  className="w-16 border rounded px-2 py-1"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={
                  page >=
                  (users as { pagination: { pages: number } }).pagination.pages
                }
              >
                Next
              </Button>

              <Button
                size="sm"
                onClick={() =>
                  setPage(
                    (users as { pagination: { pages: number } }).pagination
                      .pages
                  )
                }
                disabled={
                  page >=
                  (users as { pagination: { pages: number } }).pagination.pages
                }
              >
                {'>>'}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {`Total: ${(users as { pagination: { total: number } }).pagination.total}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
