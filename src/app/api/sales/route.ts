import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const sale = await db.sale.create({
      data: {
        saleDate: new Date(),
        total: total,
        status,
        userId: session.user.id,
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

    // If sale is completed, deduct from inventory
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
      { data: sale, message: 'Sale created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
