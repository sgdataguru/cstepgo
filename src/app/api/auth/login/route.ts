import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/credentials';
import { nanoid } from 'nanoid';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = loginSchema.parse(body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        driverProfile: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session token
    const expirationTime = validatedData.remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationTime);
    const token = nanoid(64);
    
    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt
      }
    });
    
    // Determine redirect URL based on role
    let dashboardUrl = '/trips';
    if (user.role === 'DRIVER') {
      dashboardUrl = '/driver/dashboard';
    } else if (user.role === 'ADMIN') {
      dashboardUrl = '/admin/dashboard';
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      session: {
        token: token,
        expiresAt: expiresAt.toISOString()
      },
      navigation: {
        dashboardUrl
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
