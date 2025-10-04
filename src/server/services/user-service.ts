import { UserRepository, UserListParams } from '../repositories/user-repository'
import { wrapCache } from '@/lib/in-memory-cache'
import { startRequestTimer, endRequestTimer } from '@/lib/request-timing'

export interface UserServiceDeps {
  userRepository: UserRepository
}

export class UserService {
  private repo: UserRepository
  constructor(deps: UserServiceDeps) {
    this.repo = deps.userRepository
  }

  async list(params: UserListParams, enableCache = true) {
    const { page, limit, q } = params
    const cacheKey = `users:list:svc:${page || ''}:${limit || ''}:${q || ''}`
    const timer = startRequestTimer('users:service:list')

    const exec = async () => this.repo.list(params)
    const result = enableCache
      ? await wrapCache(cacheKey, 10000, exec)
      : await exec()

    endRequestTimer(timer, { cacheKey, page, limit })
    return result
  }
}
