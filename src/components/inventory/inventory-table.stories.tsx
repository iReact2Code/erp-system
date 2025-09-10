import type { Meta, StoryObj } from '@storybook/react'
import { InventoryTable } from '../inventory/inventory-table'
import { createMockInventoryItem } from '../../lib/test-utils'

const meta: Meta<typeof InventoryTable> = {
  title: 'Components/InventoryTable',
  component: InventoryTable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockInventoryData = [
  createMockInventoryItem({ id: '1', name: 'Product A', sku: 'PROD-001' }),
  createMockInventoryItem({
    id: '2',
    name: 'Product B',
    sku: 'PROD-002',
    quantity: 5,
  }),
  createMockInventoryItem({
    id: '3',
    name: 'Product C',
    sku: 'PROD-003',
    status: 'LOW_STOCK',
  }),
]

export const Default: Story = {
  args: {
    data: mockInventoryData,
  },
}

export const Empty: Story = {
  args: {
    data: [],
  },
}

export const Loading: Story = {
  args: {
    data: mockInventoryData,
    isLoading: true,
  },
}

export const WithManyItems: Story = {
  args: {
    data: [
      ...mockInventoryData,
      ...mockInventoryData.map((item, index) => ({
        ...item,
        id: `${item.id}_${index}`,
        name: `${item.name} (Copy ${index + 1})`,
      })),
    ],
  },
}
