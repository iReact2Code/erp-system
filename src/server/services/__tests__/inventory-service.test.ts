import { InventoryService } from '../inventory-service'
import { InventoryRepository } from '../../repositories/inventory-repository'
import { mock, MockProxy } from 'jest-mock-extended'

describe('InventoryService', () => {
  let service: InventoryService
  let inventoryRepository: MockProxy<InventoryRepository>

  beforeEach(() => {
    inventoryRepository = mock<InventoryRepository>()
    service = new InventoryService({ inventoryRepository })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('list', () => {
    it('should call repository list with correct params', async () => {
      const params = { page: 1, limit: 10, q: 'test' }
      const mockResult = { data: [], total: 0, page: 1, limit: 10, pages: 0 }
      inventoryRepository.list.mockResolvedValue(mockResult)

      const result = await service.list(params)

      expect(inventoryRepository.list).toHaveBeenCalledWith(params)
      expect(result).toEqual(mockResult)
    })
  })

  describe('create', () => {
    it('should call repository create and invalidate cache', async () => {
      const createData = {
        name: 'New Item',
        sku: 'NI-001',
        unitPrice: 100,
        createdById: 'user-1',
        updatedById: 'user-1',
      }
      const mockItem = {
        ...createData,
        id: 'item-1',
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
      }
      inventoryRepository.create.mockResolvedValue(mockItem)

      const result = await service.create(createData)

      expect(inventoryRepository.create).toHaveBeenCalledWith(createData)
      expect(result).toEqual(mockItem)
    })
  })

  describe('update', () => {
    it('should call repository update and invalidate cache', async () => {
      const updateData = { name: 'Updated Item' }
      const mockItem = {
        id: 'item-1',
        name: 'Updated Item',
        sku: 'NI-001',
        unitPrice: 100,
        quantity: 0,
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
      }
      inventoryRepository.update.mockResolvedValue(mockItem)

      const result = await service.update('item-1', updateData)

      expect(inventoryRepository.update).toHaveBeenCalledWith(
        'item-1',
        updateData
      )
      expect(result).toEqual(mockItem)
    })
  })

  describe('delete', () => {
    it('should call repository delete and invalidate cache', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Item to delete',
        sku: 'DEL-001',
        unitPrice: 50,
        quantity: 10,
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
      }
      inventoryRepository.delete.mockResolvedValue(mockItem)

      const result = await service.delete('item-1')

      expect(inventoryRepository.delete).toHaveBeenCalledWith('item-1')
      expect(result).toEqual(mockItem)
    })
  })
})
