// Mock Prisma client for build-time when database isn't available

// Mock enums
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
  THIRD_PARTY_CLIENT = 'THIRD_PARTY_CLIENT',
  SUPERVISOR = 'SUPERVISOR',
  CLERK = 'CLERK',
}

// Mock PrismaClient class
export class PrismaClient {
  async $connect() {
    return Promise.resolve()
  }

  async $disconnect() {
    return Promise.resolve()
  }

  async $transaction(fn: (prisma: PrismaClient) => Promise<unknown>) {
    return fn(this)
  }

  user = {
    findUnique: async (_args?: unknown) => ({
      id: 'mock-user',
      email: 'mock@example.com',
      name: 'Mock User',
      hashedPassword: 'hashed-password',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      email: 'mock@example.com',
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      email: 'mock@example.com',
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      email: 'mock@example.com',
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
  }

  product = {
    findUnique: async (_args?: unknown) => null,
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Product',
      price: 0,
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Product',
      price: 0,
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Product',
      price: 0,
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
  }

  order = {
    findUnique: async (_args?: unknown) => ({
      id: 'mock',
      userId: 'mock',
      status: 'PENDING' as 'PENDING' | 'DELIVERED' | 'CANCELLED',
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'mock-item',
          orderId: 'mock',
          inventoryItemId: 'mock-inventory',
          quantity: 1,
          price: 0,
        },
      ],
    }),
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      userId: 'mock',
      status: 'PENDING' as 'PENDING' | 'DELIVERED' | 'CANCELLED',
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      userId: 'mock',
      status: 'PENDING' as 'PENDING' | 'DELIVERED' | 'CANCELLED',
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      userId: 'mock',
      status: 'PENDING' as 'PENDING' | 'DELIVERED' | 'CANCELLED',
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
  }

  orderItem = {
    findUnique: async (_args?: unknown) => null,
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      orderId: 'mock',
      productId: 'mock',
      quantity: 1,
      price: 0,
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      orderId: 'mock',
      productId: 'mock',
      quantity: 1,
      price: 0,
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      orderId: 'mock',
      productId: 'mock',
      quantity: 1,
      price: 0,
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
    createMany: async (_args?: unknown) => ({ count: 0 }),
  }

  purchase = {
    findUnique: async (_args?: unknown) => null,
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      supplierId: 'mock',
      status: 'PENDING' as const,
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      supplierId: 'mock',
      status: 'PENDING' as const,
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'mock-item',
          purchaseId: 'mock',
          inventoryItemId: 'mock-inventory',
          quantity: 1,
          unitPrice: 50.0,
        },
      ],
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      supplierId: 'mock',
      status: 'PENDING' as const,
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
  }

  purchaseItem = {
    findUnique: async (_args?: unknown) => null,
    findMany: async (_args?: unknown) => [],
    create: async (_args?: unknown) => ({
      id: 'mock',
      purchaseId: 'mock',
      inventoryItemId: 'mock',
      quantity: 1,
      unitPrice: 50.0,
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      purchaseId: 'mock',
      inventoryItemId: 'mock',
      quantity: 1,
      unitPrice: 50.0,
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      purchaseId: 'mock',
      inventoryItemId: 'mock',
      quantity: 1,
      unitPrice: 50.0,
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
    createMany: async (_args?: unknown) => ({ count: 0 }),
  }

  sale = {
    findUnique: async (_args?: unknown) => null,
    findMany: async (_args?: unknown) => [
      {
        id: 'mock',
        customerId: 'mock',
        total: 100,
        saleDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      },
    ],
    create: async (_args?: unknown) => ({
      id: 'mock',
      customerId: 'mock',
      total: 0,
      saleDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      customerId: 'mock',
      total: 0,
      saleDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      customerId: 'mock',
      total: 0,
      saleDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    count: async (_args?: unknown) => 0,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
  }

  inventoryItem = {
    findUnique: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Inventory Item',
      description: 'Mock Description',
      sku: 'MOCK-SKU',
      quantity: 10,
      price: 50.0,
      category: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findMany: async (_args?: unknown) => [
      {
        id: 'mock',
        name: 'Mock Inventory Item',
        description: 'Mock Description',
        sku: 'MOCK-SKU',
        quantity: 10,
        price: 50.0,
        category: 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    create: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Inventory Item',
      description: 'Mock Description',
      sku: 'MOCK-SKU',
      quantity: 10,
      price: 50.0,
      category: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Inventory Item',
      description: 'Mock Description',
      sku: 'MOCK-SKU',
      quantity: 10,
      price: 50.0,
      category: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async (_args?: unknown) => ({
      id: 'mock',
      name: 'Mock Inventory Item',
      description: 'Mock Description',
      sku: 'MOCK-SKU',
      quantity: 10,
      price: 50.0,
      category: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    count: async (_args?: unknown) => 1,
    findFirst: async (_args?: unknown) => null,
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
  }
}
