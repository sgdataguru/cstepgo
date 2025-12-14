import { NextRequest } from 'next/server';
import { verifyAccessToken, extractBearerToken, TokenPayload } from './jwt';
import { prisma } from '@/lib/prisma';

/**
 * Securely authenticate a driver from the request
 * Uses JWT token validation and session verification
 * 
 * @param request - The NextRequest object
 * @returns The authenticated driver with user information
 * @throws Error if authentication fails
 */
export async function authenticateDriver(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    let token = extractBearerToken(authHeader);

    // Fallback to cookie if no Authorization header
    if (!token) {
      token = request.cookies.get('driver_session')?.value || 
              request.cookies.get('access_token')?.value || 
              null;
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    // Check if it's a JWT token (contains 2 dots indicating 3 base64-encoded parts)
    // JWT format: header.payload.signature
    const jwtParts = token.split('.');
    const isJWT = jwtParts.length === 3;
    
    let userId: string;
    let userRole: string;

    if (isJWT) {
      // Verify JWT token
      const payload = verifyAccessToken(token);
      userId = payload.userId;
      userRole = payload.role;

      // Verify session in database if sessionId is present
      if (payload.sessionId) {
        const session = await prisma.session.findFirst({
          where: {
            userId: payload.userId,
            token: token, // Full token match for JWT
            expiresAt: { gt: new Date() },
          },
        });

        if (!session) {
          throw new Error('Session expired or invalid');
        }
      }
    } else {
      // Simple session token - validate against database
      const session = await prisma.session.findFirst({
        where: {
          token: token,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw new Error('Session expired or invalid');
      }

      userId = session.userId;
      userRole = session.user.role;
    }

    // Verify user is a driver
    if (userRole !== 'DRIVER') {
      throw new Error('User is not a driver');
    }

    // Fetch driver profile
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      include: {
        user: true,
      },
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    // Verify driver is approved (or at least not rejected/suspended)
    if (driver.status === 'REJECTED') {
      throw new Error('Driver account has been rejected');
    }

    if (driver.status === 'SUSPENDED') {
      throw new Error('Driver account is suspended');
    }

    return driver;
  } catch (error: any) {
    console.error('Driver authentication error:', error);
    throw error;
  }
}

/**
 * Verify that a driver owns/is assigned to a specific trip
 * 
 * @param driverId - The driver's ID
 * @param tripId - The trip's ID
 * @throws Error if driver doesn't own the trip
 */
export async function verifyDriverOwnsTrip(driverId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { driverId: true },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  if (trip.driverId !== driverId) {
    throw new Error('Driver is not assigned to this trip');
  }
}

/**
 * Verify that a trip can be accepted by a driver
 * Checks that the trip is available and not already assigned
 * 
 * @param tripId - The trip's ID
 * @throws Error if trip cannot be accepted
 */
export async function verifyTripAvailableForAcceptance(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { 
      id: true,
      driverId: true, 
      status: true,
      departureTime: true,
    },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  if (trip.status !== 'PUBLISHED') {
    throw new Error('Trip is not available for acceptance');
  }

  if (trip.driverId) {
    throw new Error('Trip has already been accepted by another driver');
  }

  // Check if trip is in the future
  if (new Date(trip.departureTime) <= new Date()) {
    throw new Error('Cannot accept past trips');
  }
}
