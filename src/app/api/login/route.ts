import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Login request body:', { email: body.email }) // Don't log password

    const { email, password } = loginSchema.parse(body)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    })

    console.log('User found:', !!user)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)
    console.log('Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create JWT token for authentication
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    const token = jwt.sign(userData, process.env.NEXTAUTH_SECRET!, {
      expiresIn: '30d',
    })

    console.log('Generated token for user:', userData.email)

    // Return token instead of setting cookies
    return NextResponse.json({
      success: true,
      token,
      user: userData,
    })
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid login data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
