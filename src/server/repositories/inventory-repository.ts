import { InventoryItem } from '@/generated/prisma'
import { buildInventoryWhere } from '@/app/api/inventory/query'
import { RepositoryContext, BaseRepository } from './base'

export interface InventoryListParams {
  page: number
  limit: number
  q?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

// Data Transfer Object (DTO) types for clearer creation/update intent.
// Quantity is intentionally excluded from create/update in this repository layer
// because business workflows (purchases/sales) handle stock adjustments.
export interface InventoryCreateInput {
  id?: string
  name: string
  sku: string
  description?: string | null
  unitPrice: number
  createdById: string
  updatedById: string
}

export interface InventoryUpdateInput {
  name?: string
  sku?: string
  description?: string | null
  unitPrice?: number
  updatedById?: string
}

export class InventoryRepository extends BaseRepository {
  constructor(ctx: RepositoryContext) {
    super(ctx)
  }

  async list(
    params: InventoryListParams
  ): Promise<PaginatedResult<InventoryItem>> {
    const { page, limit, q } = params
    const skip = (page - 1) * limit
    const where = buildInventoryWhere(q) as Record<string, unknown> | undefined

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ])

    return {
      data: items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  }

  async findById(id: string) {
    return this.prisma.inventoryItem.findUnique({ where: { id } })
  }

  async create(data: InventoryCreateInput) {
    return this.prisma.inventoryItem.create({
      data: {
        id: data.id,
        name: data.name,
        sku: data.sku,
        description: data.description,
        unitPrice: data.unitPrice,
        // quantity always starts at 0; adjusted elsewhere
        quantity: 0,
        createdById: data.createdById,
        updatedById: data.updatedById,
      },
    })
  }

  async update(id: string, data: InventoryUpdateInput) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        unitPrice: data.unitPrice,
        updatedById: data.updatedById,
        updatedAt: new Date(),
      },
    })
  }

  async delete(id: string) {
    return this.prisma.inventoryItem.delete({ where: { id } })
  }
}
