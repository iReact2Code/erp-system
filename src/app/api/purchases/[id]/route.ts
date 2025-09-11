import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update purchase status
    const updatedPurchase = await db.purchase.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    // If status is COMPLETED, update inventory quantities
    if (status === 'COMPLETED') {
      for (const item of updatedPurchase.items) {
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

    return NextResponse.json(updatedPurchase)
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    const { id } = await params

    const purchase = await db.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
