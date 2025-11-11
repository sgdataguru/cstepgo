import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Extract session token from request headers or cookies
 * @param request Next.js request object
 * @returns Session token or null
 */
export function getSessionToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookieToken = request.cookies.get('session_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Verify admin authentication and authorization
 * @param request Next.js request object
 * @returns User object if authenticated and authorized, null otherwise
 */
export async function verifyAdminAuth(request: NextRequest) {
  try {
    const token = getSessionToken(request);

    if (!token) {
      return null;
    }

    // Find valid session
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Check if session exists and is not expired
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Admin auth verification failed:', error);
    return null;
  }
}

/**
 * Middleware to require admin authentication
 * Use this in API routes to protect admin endpoints
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: NextRequest, admin: any) => Promise<Response>
): Promise<Response> {
  const admin = await verifyAdminAuth(request);

  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      },
      { status: 401 }
    );
  }

  return handler(request, admin);
}

/**
 * Extract IP address from request
 * @param request Next.js request object
 * @returns IP address
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

/**
 * Extract user agent from request
 * @param request Next.js request object
 * @returns User agent string
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
