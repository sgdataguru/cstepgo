/**
 * Shared utilities for real-time trip status broadcasting
 */

import { TripStatus } from '@prisma/client';

// Store active SSE connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Add a connection for a trip
 */
export function addConnection(
  tripId: string,
  controller: ReadableStreamDefaultController
): void {
  if (!connections.has(tripId)) {
    connections.set(tripId, new Set());
  }
  connections.get(tripId)?.add(controller);
}

/**
 * Remove a connection for a trip
 */
export function removeConnection(
  tripId: string,
  controller: ReadableStreamDefaultController
): void {
  const tripConnections = connections.get(tripId);
  if (tripConnections) {
    tripConnections.delete(controller);
    if (tripConnections.size === 0) {
      connections.delete(tripId);
    }
  }
}

/**
 * Broadcast status update to all connected clients for a trip
 */
export function broadcastStatusUpdate(
  tripId: string,
  data: {
    tripTitle: string;
    previousStatus: TripStatus;
    newStatus: TripStatus;
    driverName: string;
    notes?: string;
    originName: string;
    destName: string;
  }
): { success: boolean; connections: number; failed: number } {
  const tripConnections = connections.get(tripId);

  if (!tripConnections || tripConnections.size === 0) {
    return { success: true, connections: 0, failed: 0 };
  }

  const encoder = new TextEncoder();
  const updateMessage = `data: ${JSON.stringify({
    type: 'status_update',
    tripId,
    tripTitle: data.tripTitle,
    previousStatus: data.previousStatus,
    newStatus: data.newStatus,
    driverName: data.driverName,
    notes: data.notes,
    originName: data.originName,
    destName: data.destName,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  const encodedMessage = encoder.encode(updateMessage);

  let successCount = 0;
  let failCount = 0;

  tripConnections.forEach((controller) => {
    try {
      controller.enqueue(encodedMessage);
      successCount++;
    } catch (error) {
      console.error('Failed to send to client:', error);
      failCount++;
      tripConnections.delete(controller);
    }
  });

  return {
    success: failCount === 0,
    connections: successCount,
    failed: failCount,
  };
}

/**
 * Get connection count for a trip or all trips
 */
export function getConnectionCount(tripId?: string): number {
  if (tripId) {
    return connections.get(tripId)?.size || 0;
  }

  // Return total connections across all trips
  let total = 0;
  connections.forEach((set) => {
    total += set.size;
  });
  return total;
}

/**
 * Get all active trip IDs with connections
 */
export function getActiveTripIds(): string[] {
  return Array.from(connections.keys());
}
