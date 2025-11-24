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
 * GET /api/messages/[tripId] - Get all messages for a trip conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    const { tripId } = params;

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

    // Check if user is driver, organizer, or has a booking
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

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { tripId },
      include: {
        messages: {
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
          orderBy: {
            sentAt: 'asc',
          },
          where: {
            isHidden: false,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      // No conversation yet, return empty
      return NextResponse.json({
        success: true,
        data: {
          conversationId: null,
          messages: [],
          participants: [],
        },
      });
    }

    // Get participant info for current user
    const currentParticipant = conversation.participants.find(
      (p) => p.userId === user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messages: conversation.messages,
        participants: conversation.participants.map((p) => ({
          userId: p.userId,
          user: p.user,
          unreadCount: p.userId === user.id ? p.unreadCount : null,
          lastReadAt: p.userId === user.id ? p.lastReadAt : null,
        })),
        unreadCount: currentParticipant?.unreadCount || 0,
        lastReadAt: currentParticipant?.lastReadAt,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'Invalid or expired session') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
