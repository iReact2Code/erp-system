import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

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
