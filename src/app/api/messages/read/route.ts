import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get authenticated user from request
 */
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value;

  if (!token) {
    throw new Error('Authentication required');
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error('Invalid or expired session');
  }

  return session.user;
}

/**
 * POST /api/messages/read - Mark messages as read
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Update participant's read status
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    // Update message read status
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'Invalid or expired session') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
