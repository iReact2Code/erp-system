import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UsersTable } from '../users-table'
import { createMockUser } from '@/lib/test-utils'
import * as usersHooks from '@/features/users/hooks'
import { act } from 'react-dom/test-utils'

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

  it('debounces search input and updates hook only after delay', async () => {
    jest.useFakeTimers()

    // start with a clean mock history
    mockUsersHooks.useUsers.mockClear()

    render(<UsersTable />)

    const input = screen.getAllByRole('textbox')[0]

    // Simulate rapid typing
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })

    // Immediately after typing, the debounced value should not have propagated
    const immediateQs = mockUsersHooks.useUsers.mock.calls.map(c => c[0]?.q)
    expect(immediateQs).not.toContain('abc')

    // Advance timers by debounce delay
    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    // Wait for the effect to settle and then check that the hook was called with the final q
    await waitFor(() => {
      const qs = mockUsersHooks.useUsers.mock.calls.map(c => c[0]?.q)
      expect(qs).toContain('abc')
    })

    jest.useRealTimers()
  })
})
