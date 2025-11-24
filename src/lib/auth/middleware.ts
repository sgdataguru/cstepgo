import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken, TokenPayload } from './jwt';
import prisma from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Extract token from Authorization header or cookie
      const authHeader = req.headers.get('Authorization');
      let token = extractBearerToken(authHeader);

      // Fallback to cookie if no Authorization header
      if (!token) {
        token = req.cookies.get('access_token')?.value || null;
      }

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyAccessToken(token);

      // Optionally verify session in database (for token revocation)
      if (payload.sessionId) {
        const session = await prisma.session.findFirst({
          where: {
            userId: payload.userId,
            token: { contains: payload.sessionId },
            expiresAt: { gt: new Date() },
          },
        });

        if (!session) {
          return NextResponse.json(
            { error: 'Session expired or invalid', code: 'INVALID_SESSION' },
            { status: 401 }
          );
        }
      }

      // Attach user payload to request
      const authReq = req as AuthenticatedRequest;
      authReq.user = payload;

      // Call the actual handler
      return handler(authReq);
    } catch (error: any) {
      console.error('Auth middleware error:', error);

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
  };
}

/**
 * Middleware to verify role-based access
 */
export function withRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      const user = req.user!;

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Middleware for admin-only routes
 */
export function withAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('ADMIN')(handler);
}

/**
 * Middleware for driver-only routes
 */
export function withDriver(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('DRIVER')(handler);
}

/**
 * Extract and verify user from request (helper function)
 */
export async function getUserFromRequest(req: NextRequest): Promise<TokenPayload | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    let token = extractBearerToken(authHeader);

    if (!token) {
      token = req.cookies.get('access_token')?.value || null;
    }

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}
