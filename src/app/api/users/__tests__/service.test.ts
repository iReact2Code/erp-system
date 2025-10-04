import { fetchUsers } from '../service'

describe('fetchUsers service', () => {
  test('returns full list when no pagination provided', async () => {
    const fakeUsers = [
      { id: '1', name: 'A', email: 'a@x', role: 'USER', createdAt: new Date() },
      { id: '2', name: 'B', email: 'b@x', role: 'USER', createdAt: new Date() },
    ]

    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue(fakeUsers),
      },
    }

    const res = await fetchUsers(db)
    expect(res).toBe(fakeUsers)
    expect(db.user.findMany).toHaveBeenCalled()
  })

  test('returns paginated shape when page provided', async () => {
    const items = [
      { id: '1', name: 'A', email: 'a@x', role: 'USER', createdAt: new Date() },
    ]
    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(1),
      },
    }

    const res = await fetchUsers(db, { q: 'a', page: 1, limit: 10 })
    expect(res).toHaveProperty('data')
    expect(res).toHaveProperty('pagination')
    expect(res.pagination.total).toBe(1)
    expect(db.user.findMany).toHaveBeenCalled()
    expect(db.user.count).toHaveBeenCalled()
  })
})
