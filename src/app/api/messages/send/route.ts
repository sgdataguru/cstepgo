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
 * POST /api/messages/send - Send a message (REST fallback for non-WebSocket)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { tripId, content, type = 'TEXT', metadata } = body;

    if (!tripId || !content) {
      return NextResponse.json(
        { error: 'tripId and content are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      trip.driverId === user.id ||
      trip.organizerId === user.id ||
      trip.bookings.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { tripId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { tripId },
      });
    }

    // Ensure user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: user.id,
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content,
        type,
        metadata,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Increment unread count for other participants
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: { not: user.id },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'Invalid or expired session') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
