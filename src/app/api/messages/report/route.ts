import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
 * POST /api/messages/report - Report a message for abuse
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { messageId, reason } = body;

    if (!messageId || !reason) {
      return NextResponse.json(
        { error: 'messageId and reason are required' },
        { status: 400 }
      );
    }

    // Get message and verify access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.conversation.participants.length === 0) {
      return NextResponse.json(
        { error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Mark message as reported
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isReported: true,
        reportReason: reason,
      },
    });

    // Create notification for admins
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL environment variable not set, skipping notification');
    } else {
      await prisma.notification.create({
        data: {
          type: 'MESSAGE_REPORT',
          channel: 'EMAIL',
          recipient: adminEmail,
          subject: 'Message Reported for Abuse',
          body: `Message ${messageId} was reported by user ${user.id} for: ${reason}`,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Message reported successfully',
    });
  } catch (error) {
    console.error('Error reporting message:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'Invalid or expired session') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to report message' },
      { status: 500 }
    );
  }
}
