import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { UserRole } from '@/lib/prisma-mock'
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

    let updatedPurchase

    if (status === 'COMPLETED') {
      // perform update and inventory increments in a transaction
      updatedPurchase = await db.$transaction(async tx => {
        const p = await tx.purchase.update({
          where: { id },
          data: { status },
          include: {
            items: {
              include: { inventoryItem: true },
            },
          },
        })

        for (const item of p.items) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              quantity: { increment: item.quantity },
              updatedAt: new Date(),
            },
          })
        }

        return p
      })
    } else {
      updatedPurchase = await db.purchase.update({
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
    }

    // Audit the status change
    try {
      const { auditPurchaseAction } = await import('@/lib/audit-logger')
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      auditPurchaseAction(
        'PURCHASE_COMPLETED',
        updatedPurchase.id,
        updatedPurchase.total,
        user!.id,
        user!.email,
        user!.role as unknown as UserRole,
        clientIP,
        userAgent
      )
    } catch {
      // ignore audit errors
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
