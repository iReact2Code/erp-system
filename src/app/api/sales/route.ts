import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

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

    const sale = await db.sale.create({
      data: {
        saleDate: new Date(),
        total: total,
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
