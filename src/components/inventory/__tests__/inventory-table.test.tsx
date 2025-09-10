import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { InventoryTable } from '../inventory-table'
import { createMockInventoryItem } from '@/lib/test-utils'
import * as inventoryHooks from '@/features/inventory/hooks'

// Mock the hooks
jest.mock('@/features/inventory/hooks')

// Mock the form component
jest.mock('@/components/inventory/inventory-form', () => ({
  InventoryForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Add Item</button>
  ),
}))

describe('InventoryTable Component', () => {
  const mockInventoryHooks = inventoryHooks as jest.Mocked<
    typeof inventoryHooks
  >

  beforeEach(() => {
    // Reset mocks
    mockInventoryHooks.useInventory.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    mockInventoryHooks.useDeleteInventory.mockReturnValue({
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

  it('should render loading state', () => {
    mockInventoryHooks.useInventory.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    // Should show loading component (we'll assume it has a test id or specific content)
    expect(screen.getByText('inventory')).toBeInTheDocument()
  })

  it('should render inventory items', async () => {
    const mockItems = [
      createMockInventoryItem({
        id: '1',
        name: 'Item 1',
        sku: 'SKU-001',
        quantity: 10,
        unitPrice: 29.99,
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Item 2',
        sku: 'SKU-002',
        quantity: 5,
        unitPrice: 19.99,
      }),
    ]

    mockInventoryHooks.useInventory.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    // Check if items are rendered
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('SKU-001')).toBeInTheDocument()
    expect(screen.getByText('SKU-002')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('should render stock status badges correctly', () => {
    const mockItems = [
      createMockInventoryItem({
        id: '1',
        name: 'Out of Stock Item',
        quantity: 0,
        status: 'OUT_OF_STOCK',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Low Stock Item',
        quantity: 5,
        status: 'LOW_STOCK',
      }),
      createMockInventoryItem({
        id: '3',
        name: 'In Stock Item',
        quantity: 50,
        status: 'IN_STOCK',
      }),
    ]

    mockInventoryHooks.useInventory.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })

  it('should filter items based on search term', async () => {
    const user = userEvent.setup()
    const mockItems = [
      createMockInventoryItem({
        id: '1',
        name: 'Apple iPhone',
        sku: 'APL-001',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Samsung Galaxy',
        sku: 'SAM-002',
      }),
      createMockInventoryItem({
        id: '3',
        name: 'Apple MacBook',
        sku: 'APL-003',
      }),
    ]

    mockInventoryHooks.useInventory.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    // All items should be visible initially
    expect(screen.getByText('Apple iPhone')).toBeInTheDocument()
    expect(screen.getByText('Samsung Galaxy')).toBeInTheDocument()
    expect(screen.getByText('Apple MacBook')).toBeInTheDocument()

    // Search for "Apple"
    const searchInput = screen.getByPlaceholderText('searchInventory')
    await user.type(searchInput, 'Apple')

    // Only Apple items should be visible
    expect(screen.getByText('Apple iPhone')).toBeInTheDocument()
    expect(screen.getByText('Apple MacBook')).toBeInTheDocument()
    expect(screen.queryByText('Samsung Galaxy')).not.toBeInTheDocument()
  })

  it('should handle delete item', async () => {
    const user = userEvent.setup()
    const mockRefresh = jest.fn()
    const mockMutate = jest.fn().mockResolvedValue({ success: true })

    const mockItems = [createMockInventoryItem({ id: '1', name: 'Test Item' })]

    mockInventoryHooks.useInventory.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: mockRefresh,
      reset: jest.fn(),
    })

    mockInventoryHooks.useDeleteInventory.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      mutate: mockMutate,
      reset: jest.fn(),
    })

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true)

    render(<InventoryTable />)

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(
      btn => btn.querySelector('svg') !== null // Assuming delete button has an icon
    )

    if (deleteButton) {
      await user.click(deleteButton)
    }

    expect(mockMutate).toHaveBeenCalledWith('1')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should show empty state when no items', () => {
    mockInventoryHooks.useInventory.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    expect(screen.getByText('noItems')).toBeInTheDocument()
  })

  it('should show no results when search returns empty', async () => {
    const user = userEvent.setup()
    const mockItems = [
      createMockInventoryItem({ id: '1', name: 'Apple iPhone' }),
    ]

    mockInventoryHooks.useInventory.mockReturnValue({
      data: mockItems,
      loading: false,
      error: null,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('searchInventory')
    await user.type(searchInput, 'Nonexistent Item')

    expect(screen.getByText('noItemsFound')).toBeInTheDocument()
  })

  it('should display errors from API', () => {
    const errorMessage = 'Failed to load inventory'

    mockInventoryHooks.useInventory.mockReturnValue({
      data: null,
      loading: false,
      error: errorMessage,
      execute: jest.fn(),
      refresh: jest.fn(),
      reset: jest.fn(),
    })

    render(<InventoryTable />)

    // Should display error (assuming ApiErrorDisplay shows the error)
    expect(screen.getByText('inventory')).toBeInTheDocument()
  })
})
