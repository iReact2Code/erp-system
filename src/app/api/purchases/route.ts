import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const purchases = await db.purchase.findMany({
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: purchases })
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

    const purchase = await db.purchase.create({
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
