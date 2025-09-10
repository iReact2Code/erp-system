import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PurchasesTable } from '../purchases-table'
import { createMockPurchase } from '@/lib/test-utils'
import * as purchasesHooks from '@/features/purchases/hooks'

// Mock the hooks
jest.mock('@/features/purchases/hooks')

describe('PurchasesTable Component', () => {
  const mockPurchasesHooks = purchasesHooks as jest.Mocked<
    typeof purchasesHooks
  >

  beforeEach(() => {
    // Reset mocks
    mockPurchasesHooks.usePurchases.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    mockPurchasesHooks.useDeletePurchase.mockReturnValue({
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
    render(<PurchasesTable />)
    expect(screen.getByText('purchases')).toBeInTheDocument()
  })

  it('should render purchase items', () => {
    const mockItems = [
      createMockPurchase({
        id: '1',
        total: 199.99,
        status: 'COMPLETED',
        purchaseDate: '2024-01-01',
      }),
    ]

    mockPurchasesHooks.usePurchases.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<PurchasesTable />)

    expect(screen.getByText('$199.99')).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    mockPurchasesHooks.usePurchases.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<PurchasesTable />)

    expect(screen.getByText('noPurchases')).toBeInTheDocument()
  })
})
