import {
  InventoryRepository,
  InventoryListParams,
  InventoryCreateInput,
  InventoryUpdateInput,
} from '../repositories/inventory-repository'
import { wrapCache, clearCacheByPrefix } from '@/lib/in-memory-cache'
import { startRequestTimer, endRequestTimer } from '@/lib/request-timing'

export interface InventoryServiceDeps {
  inventoryRepository: InventoryRepository
}

export class InventoryService {
  private repo: InventoryRepository
  constructor(deps: InventoryServiceDeps) {
    this.repo = deps.inventoryRepository
  }

  async list(params: InventoryListParams, enableCache = true) {
    const { page, limit, q } = params
    const cacheKey = `inventory:list:svc:${page}:${limit}:${q || ''}`
    const timer = startRequestTimer('inventory:service:list')

    const exec = async () => this.repo.list(params)
    const result = enableCache
      ? await wrapCache(cacheKey, 10000, exec)
      : await exec()

    endRequestTimer(timer, { cacheKey, page, limit })
    return result
  }

  async create(data: InventoryCreateInput) {
    const timer = startRequestTimer('inventory:service:create')
    const result = await this.repo.create(data)

    // When an item is created, invalidate list caches to prevent staleness
    clearCacheByPrefix('inventory:list:svc:')

    endRequestTimer(timer)
    return result
  }

  async update(id: string, data: InventoryUpdateInput) {
    const timer = startRequestTimer('inventory:service:update')
    const result = await this.repo.update(id, data)

    // Invalidate caches for both lists and the specific item
    clearCacheByPrefix('inventory:list:svc:')
    clearCacheByPrefix(`inventory:item:${id}`) // If you cache items by ID

    endRequestTimer(timer)
    return result
  }

  async delete(id: string) {
    const timer = startRequestTimer('inventory:service:delete')
    const result = await this.repo.delete(id)

    // Invalidate caches for lists and the deleted item
    clearCacheByPrefix('inventory:list:svc:')
    clearCacheByPrefix(`inventory:item:${id}`)

    endRequestTimer(timer)
    return result
  }
}
