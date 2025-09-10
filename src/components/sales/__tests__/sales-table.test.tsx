import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SalesTable } from '../sales-table'
import { createMockSale } from '@/lib/test-utils'
import * as salesHooks from '@/features/sales/hooks'

// Mock the hooks
jest.mock('@/features/sales/hooks')

describe('SalesTable Component', () => {
  const mockSalesHooks = salesHooks as jest.Mocked<typeof salesHooks>

  beforeEach(() => {
    // Reset mocks
    mockSalesHooks.useSales.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    mockSalesHooks.useDeleteSale.mockReturnValue({
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
    render(<SalesTable />)
    expect(screen.getByText('sales')).toBeInTheDocument()
  })

  it('should render sales items', () => {
    const mockItems = [
      createMockSale({
        id: '1',
        total: 99.99,
        status: 'COMPLETED',
        saleDate: '2024-01-01',
      }),
    ]

    mockSalesHooks.useSales.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<SalesTable />)

    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    mockSalesHooks.useSales.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<SalesTable />)

    expect(screen.getByText('noSales')).toBeInTheDocument()
  })
})
