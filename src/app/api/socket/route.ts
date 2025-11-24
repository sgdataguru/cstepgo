import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { prisma } from '@/lib/prisma';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import { setupRealtimeHandlers } from '@/lib/realtime/socketHandlers';

// Store the Socket.IO server instance
let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
function initSocketIO(server: NetServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      // Get authentication token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify session token
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid or expired session'));
      }

      // Attach user info to socket
      socket.data.userId = session.userId;
      socket.data.user = session.user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Initialize real-time broadcast service
  realtimeBroadcastService.initialize(io);

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Setup real-time event handlers (trip offers, location updates, etc.)
    setupRealtimeHandlers(socket, io);

    // Handle joining a conversation room
    socket.on('join:conversation', async (data: { tripId: string }) => {
      try {
        const { tripId } = data;

        // Verify user has access to this trip
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: {
            bookings: {
              where: { userId },
              select: { id: true },
            },
          },
        });

        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        // Check if user is driver, organizer, or has a booking
        const hasAccess =
          trip.driverId === userId ||
          trip.organizerId === userId ||
          trip.bookings.length > 0;

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this conversation' });
          return;
        }

        // Get or create conversation
        let conversation = await prisma.conversation.findUnique({
          where: { tripId },
          include: {
            participants: true,
          },
        });

        if (!conversation) {
          // Create conversation
          conversation = await prisma.conversation.create({
            data: {
              tripId,
            },
            include: {
              participants: true,
            },
          });
        }

        // Add user as participant if not already
        const isParticipant = conversation.participants.some(
          (p) => p.userId === userId
        );

        if (!isParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId,
            },
          });
        }

        // Join the conversation room
        socket.join(`conversation:${conversation.id}`);
        
        socket.emit('conversation:joined', {
          conversationId: conversation.id,
          tripId,
        });

        console.log(`User ${userId} joined conversation ${conversation.id}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle sending a message
    socket.on('message:send', async (data: {
      conversationId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION';
      metadata?: any;
    }) => {
      try {
        const { conversationId, content, type = 'TEXT', metadata } = data;

        // Verify user is a participant
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!participant) {
          socket.emit('error', { message: 'Not a participant of this conversation' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
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
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        // Increment unread count for other participants
        await prisma.conversationParticipant.updateMany({
          where: {
            conversationId,
            userId: { not: userId },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });

        // Broadcast message to all participants in the conversation
        io?.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send delivery confirmation to sender
        socket.emit('message:sent', {
          messageId: message.id,
          tempId: data.metadata?.tempId,
        });

        console.log(`Message sent by ${userId} in conversation ${conversationId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', async (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId,
        userName: socket.data.user.name,
      });
    });

    socket.on('typing:stop', async (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId,
      });
    });

    // Handle marking messages as read
    socket.on('messages:read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Update participant's read status
        await prisma.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
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
            senderId: { not: userId },
            readAt: null,
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        });

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          userId,
          conversationId,
        });

        console.log(`Messages marked as read by ${userId} in conversation ${conversationId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

/**
 * GET endpoint to get Socket.IO server status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Socket.IO server running',
    path: '/api/socket',
  });
}
