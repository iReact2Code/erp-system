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

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.max(1, Math.min(200, parseInt(limitParam || '25')))
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      db.purchase.findMany({
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
      db.purchase.count(),
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching purchases:', error)
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
    const { total, status, items } = body

    // Create purchase and increment inventory quantities inside a transaction
    const purchase = await db.$transaction(async tx => {
      // Create the purchase and its items
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseDate: new Date(),
          total: parseFloat(total),
          status,
          userId: user!.id,
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

      // Update inventory quantities for each item (increment)
      for (const it of items) {
        await tx.inventoryItem.update({
          where: { id: it.inventoryItemId },
          data: {
            quantity: { increment: it.quantity },
            updatedAt: new Date(),
            updatedById: user!.id,
          },
        })
      }

      return createdPurchase
    })

    // Audit the purchase creation
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const { auditPurchaseAction } = await import('@/lib/audit-logger')
      auditPurchaseAction(
        'PURCHASE_CREATED',
        purchase.id,
        purchase.total,
        user!.id,
        user!.email,
        user!.role as unknown as UserRole,
        clientIP,
        userAgent
      )
    } catch (e) {
      // don't block response on audit failure
      console.warn('Audit logging failed for purchase creation', e)
    }

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating purchase:', error)
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
    const { id, total, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const purchase = await db.purchase.update({
      where: { id },
      data: {
        total: parseFloat(total),
        status,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    return NextResponse.json(purchase)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Delete purchase items first, then purchase
    await db.purchaseItem.deleteMany({
      where: { purchaseId: id },
    })

    await db.purchase.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
