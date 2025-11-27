import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from './jwt';
import prisma from '@/lib/prisma';

/**
 * Admin middleware - checks if user has ADMIN role
 * Usage: Wrap admin API routes with this middleware
 * 
 * This function verifies JWT tokens and validates that the user has the ADMIN role.
 * Returns null if authorized, or an error response if unauthorized.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    let token = extractBearerToken(authHeader);
    
    // Fallback to cookie if no Authorization header
    if (!token) {
      token = request.cookies.get('access_token')?.value || null;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication provided' },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: any) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Token expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
    
    // Check if user has ADMIN role
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Optionally verify session in database (for token revocation)
    if (payload.sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          userId: payload.userId,
          token: payload.sessionId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Session expired or invalid' },
          { status: 401 }
        );
      }
    }
    
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
