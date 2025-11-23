import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin middleware - checks if user has ADMIN role
 * Usage: Wrap admin API routes with this middleware
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // TODO: Implement proper session/JWT authentication
    // For now, check Authorization header or cookie
    
    const authHeader = request.headers.get('Authorization');
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!authHeader && !sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication provided' },
        { status: 401 }
      );
    }
    
    // TODO: Validate session token and get user
    // const session = await prisma.session.findUnique({
    //   where: { token: sessionToken },
    //   include: { user: true },
    // });
    
    // Mock: For development, allow admin access
    // Remove this in production!
    console.warn('⚠️ [DEV MODE] Admin middleware bypassed - implement proper auth!');
    
    // In production, check:
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Forbidden - Admin access required' },
    //     { status: 403 }
    //   );
    // }
    
    // Allow request to proceed
    return null;
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if current session belongs to an admin user
 */
export async function isAdmin(sessionToken: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });
    
    return session?.user.role === 'ADMIN';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current admin user from session
 */
export async function getAdminUser(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });
    
    if (!session || session.user.role !== 'ADMIN') {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}
