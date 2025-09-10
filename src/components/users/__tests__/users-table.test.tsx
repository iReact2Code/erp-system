import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UsersTable } from '../users-table'
import { createMockUser } from '@/lib/test-utils'
import * as usersHooks from '@/features/users/hooks'

// Mock the hooks
jest.mock('@/features/users/hooks')

describe('UsersTable Component', () => {
  const mockUsersHooks = usersHooks as jest.Mocked<typeof usersHooks>

  beforeEach(() => {
    // Reset mocks
    mockUsersHooks.useUsers.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    mockUsersHooks.useDeleteUser.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      mutate: jest.fn(),
      reset: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<UsersTable />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('should render user items', () => {
    const mockItems = [
      createMockUser({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ADMIN',
      }),
    ]

    mockUsersHooks.useUsers.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<UsersTable />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    mockUsersHooks.useUsers.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<UsersTable />)

    expect(screen.getByText('noUsers')).toBeInTheDocument()
  })
})
