import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken, TokenPayload } from './jwt';
import prisma from '@/lib/prisma';

// Re-export TokenPayload for use in other modules
export type { TokenPayload };

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 * Returns the user payload if valid, throws error otherwise
 */
export async function authenticateRequest(req: NextRequest): Promise<TokenPayload> {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.get('Authorization');
    let token = extractBearerToken(authHeader);

    // Fallback to cookie if no Authorization header
    if (!token) {
      token = req.cookies.get('access_token')?.value || null;
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Optionally verify session in database (for token revocation)
    if (payload.sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          userId: payload.userId,
          token: payload.sessionId, // Exact match on session ID
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new Error('Session expired or invalid');
      }
    }

    return payload;
  } catch (error: any) {
    console.error('Auth error:', error);
    throw error;
  }
}

/**
 * Verify user has required role
 */
export function verifyRole(user: TokenPayload, allowedRoles: string | string[]): void {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * Helper to get authenticated user from request
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<TokenPayload | null> {
  try {
    return await authenticateRequest(req);
  } catch (error) {
    return null;
  }
}

/**
 * Wrapper for authenticated route handlers
 * Usage: export const POST = withAuth(async (req, user) => { ... });
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, user: TokenPayload, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await authenticateRequest(req);
      return handler(req, user, ...args);
    } catch (error: any) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Token expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
  };
}

/**
 * Wrapper for role-based route handlers
 */
export function withRole<T extends any[]>(roles: string | string[]) {
  return (handler: (req: NextRequest, user: TokenPayload, ...args: T) => Promise<NextResponse>) => {
    return withAuth(async (req: NextRequest, user: TokenPayload, ...args: T) => {
      try {
        verifyRole(user, roles);
        return handler(req, user, ...args);
      } catch (error) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    });
  };
}

/**
 * Wrapper for admin-only routes
 */
export function withAdmin<T extends any[]>(
  handler: (req: NextRequest, user: TokenPayload, ...args: T) => Promise<NextResponse>
) {
  return withRole<T>('ADMIN')(handler);
}

/**
 * Wrapper for driver-only routes
 */
export function withDriver<T extends any[]>(
  handler: (req: NextRequest, user: TokenPayload, ...args: T) => Promise<NextResponse>
) {
  return withRole<T>('DRIVER')(handler);
}

/**
 * Extract and verify user from request (helper function)
 */
export async function getUserFromRequest(req: NextRequest): Promise<TokenPayload | null> {
  return getAuthenticatedUser(req);
}
