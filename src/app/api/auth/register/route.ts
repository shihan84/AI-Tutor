import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole, GradeLevel } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, gradeLevel, dateOfBirth, phone, address } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role as UserRole,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      phone,
      address
    }

    const user = await db.user.create({
      data: userData
    })

    // Create role-specific profile
    if (role === 'STUDENT') {
      if (!gradeLevel) {
        return NextResponse.json(
          { error: 'Grade level is required for students' },
          { status: 400 }
        )
      }

      await db.student.create({
        data: {
          userId: user.id,
          gradeLevel: gradeLevel as GradeLevel
        }
      })
    } else if (role === 'TEACHER') {
      await db.teacher.create({
        data: {
          userId: user.id
        }
      })
    } else if (role === 'PARENT') {
      await db.parent.create({
        data: {
          userId: user.id
        }
      })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'User registered successfully',
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}