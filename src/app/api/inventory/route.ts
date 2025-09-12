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
        db.inventoryItem.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
            quantity: true,
            unitPrice: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.inventoryItem.count(),
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

    const inventoryItems = await db.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: inventoryItems })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching inventory:', error)
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

    // Disallow direct creation of inventory through this endpoint in normal
    // operation. Inventory should be updated via purchases only. Allow only
    // users with ADMIN or MANAGER roles to perform direct adjustments.
    if (!['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_CREATE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'POST',
          }
        )
      } catch {
        // ignore audit errors
      }

      return NextResponse.json(
        { error: 'Direct inventory creation is restricted' },
        { status: 403 }
      )
    }

    // Admins may still create inventory items via this endpoint
    const body = await request.json()
    const { name, sku, description, quantity, unitPrice } = body

    const inventoryItem = await db.inventoryItem.create({
      data: {
        name,
        sku,
        description,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        createdById: user!.id,
        updatedById: user!.id,
      },
    })

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
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
    const { id, name, sku, description, quantity, unitPrice } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Restrict direct inventory updates to ADMIN and MANAGER
    if (!['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_UPDATE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'PUT',
            inventoryId: id,
          }
        )
      } catch {
        // ignore audit errors
      }

      return NextResponse.json(
        { error: 'Direct inventory updates are restricted' },
        { status: 403 }
      )
    }

    const inventoryItem = await db.inventoryItem.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        updatedById: user!.id,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(inventoryItem)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating inventory item:', error)
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

    // Restrict deletions to ADMIN role only
    if (user?.role !== 'ADMIN') {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_DELETE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'DELETE',
            inventoryId: id,
          }
        )
      } catch {
        // ignore audit errors
      }

      return NextResponse.json(
        { error: 'Direct inventory deletion is restricted' },
        { status: 403 }
      )
    }

    await db.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
