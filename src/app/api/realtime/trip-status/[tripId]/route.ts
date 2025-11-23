/**
 * Real-time Trip Status Broadcasting Service
 * Broadcasts trip status updates to connected clients via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  addConnection,
  removeConnection,
  broadcastStatusUpdate as broadcastUpdate,
} from '@/lib/realtime/broadcast';

const prisma = new PrismaClient();

/**
 * GET /api/realtime/trip-status/[tripId] - Subscribe to trip status updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const { tripId } = params;

  if (!tripId) {
    return NextResponse.json(
      { error: 'Trip ID is required' },
      { status: 400 }
    );
  }

  // Verify trip exists
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      status: true,
      title: true,
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Add this controller to the connections map
      addConnection(tripId, controller);

      // Send initial connection message with current status
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        tripId: trip.id,
        currentStatus: trip.status,
        message: 'Connected to trip status updates',
        timestamp: new Date().toISOString(),
      })}\n\n`;

      controller.enqueue(encoder.encode(initialMessage));

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('Heartbeat error:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup function
      const cleanup = () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        removeConnection(tripId, controller);
        
        try {
          controller.close();
        } catch (error) {
          // Controller may already be closed
        }
      };

      // Handle connection close
      request.signal?.addEventListener('abort', cleanup);

      // Auto-close after 2 hours to prevent memory leaks
      setTimeout(cleanup, 2 * 60 * 60 * 1000);
    },

    cancel() {
      isClosed = true;
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * POST /api/realtime/trip-status/[tripId] - Broadcast status update to all connected clients
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();
    const { status, previousStatus, driverName, notes } = body;

    if (!tripId || !status) {
      return NextResponse.json(
        { error: 'Trip ID and status are required' },
        { status: 400 }
      );
    }

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        title: true,
        status: true,
        originName: true,
        destName: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Get connected clients for this trip and broadcast
    const result = broadcastUpdate(tripId, {
      tripTitle: trip.title,
      previousStatus,
      newStatus: status,
      driverName,
      notes,
      originName: trip.originName,
      destName: trip.destName,
    });

    return NextResponse.json({
      success: true,
      message: 'Status update broadcasted',
      connections: result.connections,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast status update' },
      { status: 500 }
    );
  }
}
