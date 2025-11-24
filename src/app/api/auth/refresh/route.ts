import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, createTokenPair } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Verify session still exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        token: { contains: payload.sessionId || '' },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 401 }
      );
    }

    // Create new token pair
    const tokens = createTokenPair({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    });

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Set new access token in cookie
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });

    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expiresIn,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh - Get endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Token refresh endpoint',
    method: 'POST',
    body: {
      refreshToken: 'string - The refresh token to exchange for new tokens',
    },
    response: {
      success: 'boolean',
      accessToken: 'string - New access token',
      refreshToken: 'string - New refresh token',
      expiresIn: 'number - Access token expiration in seconds',
    },
  });
}
