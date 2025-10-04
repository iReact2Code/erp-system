import { PrismaClient } from '@/generated/prisma'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { InventoryRepository } from '../inventory-repository'
import { RepositoryContext } from '../base'

describe('InventoryRepository', () => {
  let repo: InventoryRepository
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>()
    const ctx: RepositoryContext = {
      prisma: prismaMock as unknown as PrismaClient,
    }
    repo = new InventoryRepository(ctx)
  })

  it('should be defined', () => {
    expect(repo).toBeDefined()
  })

  describe('list', () => {
    it('should fetch a paginated list of inventory items', async () => {
      const mockItems = [
        {
          id: '1',
          name: 'Item 1',
          sku: 'I1',
          quantity: 10,
          unitPrice: 1,
          createdById: 'u1',
          updatedById: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
        },
        {
          id: '2',
          name: 'Item 2',
          sku: 'I2',
          quantity: 20,
          unitPrice: 2,
          createdById: 'u1',
          updatedById: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
        },
      ]
      prismaMock.inventoryItem.findMany.mockResolvedValue(mockItems)
      prismaMock.inventoryItem.count.mockResolvedValue(2)

      const result = await repo.list({ page: 1, limit: 10 })

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should fetch a paginated and filtered list of inventory items', async () => {
      const mockItems = [
        {
          id: '1',
          name: 'Test Item 1',
          sku: 'TI1',
          quantity: 10,
          unitPrice: 1,
          createdById: 'u1',
          updatedById: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
        },
      ]
      prismaMock.inventoryItem.findMany.mockResolvedValue(mockItems)
      prismaMock.inventoryItem.count.mockResolvedValue(1)

      const result = await repo.list({ page: 1, limit: 10, q: 'Test' })

      const expectedWhere = {
        OR: [
          { name: { contains: 'Test', mode: 'insensitive' } },
          { sku: { contains: 'Test', mode: 'insensitive' } },
          { description: { contains: 'Test', mode: 'insensitive' } },
        ],
      }

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(prismaMock.inventoryItem.count).toHaveBeenCalledWith({
        where: expectedWhere,
      })
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('create', () => {
    it('should create a new inventory item with quantity 0', async () => {
      const createData = {
        name: 'New Item',
        sku: 'NI-001',
        unitPrice: 12.5,
        createdById: 'user-1',
        updatedById: 'user-1',
      }
      const expectedItem = {
        ...createData,
        id: 'new-id',
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
      }

      prismaMock.inventoryItem.create.mockResolvedValue(expectedItem)

      const result = await repo.create(createData)

      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data: {
          name: 'New Item',
          sku: 'NI-001',
          unitPrice: 12.5,
          createdById: 'user-1',
          updatedById: 'user-1',
          quantity: 0,
          id: undefined,
          description: undefined,
        },
      })
      expect(result.name).toBe('New Item')
      expect(result.quantity).toBe(0)
    })
  })
})
