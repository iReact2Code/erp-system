import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { UserRole } from '@/lib/prisma-mock'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const url = new URL(request.url)
    const pageParam = url.searchParams.get('page')
    const limitParam = url.searchParams.get('limit')

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam || '1'))
      const limit = Math.max(1, Math.min(100, parseInt(limitParam || '20')))
      const skip = (page - 1) * limit

      const [items, total] = await Promise.all([
        db.sale.findMany({
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.sale.count(),
      ])

      return NextResponse.json({
        data: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    }

    const sales = await db.sale.findMany({
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: sales })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const body = await request.json()
    const {
      total,
      status,
      items,
    }: {
      total: number
      status: string
      items: { quantity: number; unitPrice: number; inventoryItemId: string }[]
    } = body

    // Perform stock checks and create sale inside a transaction to avoid race conditions
    const sale = await db.$transaction(async tx => {
      // Fetch current quantities for all items
      const itemIds = items.map(i => i.inventoryItemId)
      const inventoryRecords = await tx.inventoryItem.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, quantity: true },
      })

      const qtyMap = new Map(inventoryRecords.map(r => [r.id, r.quantity]))

      // Verify stock availability
      for (const it of items) {
        const available = qtyMap.get(it.inventoryItemId) ?? 0
        if (status === 'COMPLETED' && available < it.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${it.inventoryItemId}`)
        }
      }

      // Create sale and items
      const createdSale = await tx.sale.create({
        data: {
          saleDate: new Date(),
          total: total,
          status,
          userId: user!.id,
          items: {
            create: items.map(it => ({
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: it.quantity * it.unitPrice,
              inventoryItemId: it.inventoryItemId,
            })),
          },
        },
        include: {
          items: {
            include: { inventoryItem: true },
          },
        },
      })

      // If completed, decrement inventory quantities
      if (status === 'COMPLETED') {
        for (const it of items) {
          await tx.inventoryItem.update({
            where: { id: it.inventoryItemId },
            data: {
              quantity: { decrement: it.quantity },
              updatedAt: new Date(),
            },
          })
        }
      }

      return createdSale
    })

    // Audit the sale creation
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const { auditSaleAction } = await import('@/lib/audit-logger')
      auditSaleAction(
        'SALE_CREATED',
        sale.id,
        sale.total,
        user!.id,
        user!.email,
        user!.role as unknown as UserRole,
        clientIP,
        userAgent
      )
    } catch (e) {
      console.warn('Audit logging failed for sale creation', e)
    }

    return NextResponse.json(
      { data: sale, message: 'Sale created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const body = await request.json()
    const {
      id,
      total,
      status,
      items,
    }: {
      id: string
      total: number
      status: string
      items: { quantity: number; unitPrice: number; inventoryItemId: string }[]
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required for updates' },
        { status: 400 }
      )
    }

    // Get the current sale to check for inventory changes
    const currentSale = await db.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!currentSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // If changing from COMPLETED to another status, restore inventory
    if (currentSale.status === 'COMPLETED' && status !== 'COMPLETED') {
      for (const item of currentSale.items) {
        await db.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    // Delete existing sale items
    await db.saleItem.deleteMany({
      where: { saleId: id },
    })

    // Update the sale with new data
    const updatedSale = await db.sale.update({
      where: { id },
      data: {
        total: total,
        status,
        items: {
          create: items.map(
            (item: {
              quantity: number
              unitPrice: number
              inventoryItemId: string
            }) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              inventoryItemId: item.inventoryItemId,
            })
          ),
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    // If sale is now completed, deduct from inventory
    if (status === 'COMPLETED') {
      for (const item of items) {
        await db.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })
      }
    }

    return NextResponse.json(
      { data: updatedSale, message: 'Sale updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
