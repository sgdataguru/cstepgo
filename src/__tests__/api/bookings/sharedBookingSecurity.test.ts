/**
 * Shared Booking Security Tests
 * 
 * These tests verify that the shared booking endpoint properly enforces authentication
 * and prevents booking forgery attacks where malicious users could create bookings
 * on behalf of other users.
 * 
 * Security Requirements:
 * 1. POST endpoint must require JWT authentication
 * 2. User identity must be derived from JWT token, not request body
 * 3. Users cannot specify a different userId in the request
 * 4. GET endpoint must only show user's own bookings (or all for admin)
 * 
 * Previous Vulnerability:
 * - The endpoint accepted userId from request body, allowing booking forgery
 * - No authentication was required
 * 
 * Fix:
 * - Added withAuth middleware to enforce JWT authentication
 * - Removed userId from request schema
 * - User ID is now extracted from verified JWT token
 */

import { NextRequest } from 'next/server';

// Mock PrismaClient before any imports
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      session: {
        findFirst: jest.fn(),
      },
      booking: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      trip: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    })),
  };
});

// Mock the prisma client before importing the routes
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    session: {
      findFirst: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  prisma: {
    session: {
      findFirst: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock jwt functions
jest.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: jest.fn(),
  extractBearerToken: jest.fn(),
  signAccessToken: jest.fn(),
}));

import { POST, GET } from '@/app/api/bookings/shared/route';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';

describe('Shared Booking Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings/shared - Authentication', () => {
    it('should reject requests without authentication token', async () => {
      // Mock missing token
      (extractBearerToken as jest.Mock).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        body: JSON.stringify({
          tripId: 'trip123',
          seatsBooked: 2,
          passengers: [
            { name: 'John Doe' },
            { name: 'Jane Doe' }
          ],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/authentication required/i);
    });

    it('should reject requests with invalid authentication token', async () => {
      // Mock invalid token
      (extractBearerToken as jest.Mock).mockReturnValue('invalid-token');
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
        body: JSON.stringify({
          tripId: 'trip123',
          seatsBooked: 2,
          passengers: [
            { name: 'John Doe' },
            { name: 'Jane Doe' }
          ],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/invalid token/i);
    });

    it('should reject requests with expired token', async () => {
      // Mock expired token
      (extractBearerToken as jest.Mock).mockReturnValue('expired-token');
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token has expired');
      });

      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer expired-token',
        },
        body: JSON.stringify({
          tripId: 'trip123',
          seatsBooked: 2,
          passengers: [
            { name: 'John Doe' },
            { name: 'Jane Doe' }
          ],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/expired/i);
    });
  });

  describe('POST /api/bookings/shared - Booking Forgery Prevention', () => {
    it('should reject requests that include userId in the body', async () => {
      const authenticatedUserId = 'auth-user-123';
      const maliciousUserId = 'victim-user-456';

      // Mock valid token with authenticated user
      (extractBearerToken as jest.Mock).mockReturnValue('valid-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: authenticatedUserId,
        email: 'user@example.com',
        role: 'USER',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: authenticatedUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      // Malicious request trying to create booking for another user
      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          tripId: 'trip123',
          userId: maliciousUserId, // Attempting to forge booking for victim
          seatsBooked: 2,
          passengers: [
            { name: 'John' },
            { name: 'Jane' }
          ],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      // Should fail validation because userId is not in schema
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/validation/i);
    });

    it('should create booking with authenticated user when userId not provided', async () => {
      const authenticatedUserId = 'auth-user-123';

      // Mock valid token with authenticated user
      (extractBearerToken as jest.Mock).mockReturnValue('valid-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: authenticatedUserId,
        email: 'user@example.com',
        role: 'USER',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: authenticatedUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      // Mock trip with available seats
      const mockTrip = {
        id: 'trip123',
        tripType: 'SHARED',
        status: 'PUBLISHED',
        totalSeats: 5,
        basePrice: 5000,
        pricePerSeat: 2500,
        platformFee: 500,
        currency: 'KZT',
        tenantId: null,
        bookings: [],
      };

      const mockBooking = {
        id: 'booking123',
        tripId: 'trip123',
        userId: authenticatedUserId,
        seatsBooked: 2,
        totalAmount: 5500,
        currency: 'KZT',
        passengers: [{ name: 'John' }, { name: 'Jane' }],
        status: 'CONFIRMED',
        createdAt: new Date(),
        confirmedAt: new Date(),
        trip: {
          id: 'trip123',
          title: 'Test Trip',
          departureTime: new Date(),
          originName: 'Almaty',
          destName: 'Astana',
          tripType: 'SHARED',
        },
        user: {
          id: authenticatedUserId,
          name: 'Authenticated User',
          email: 'user@example.com',
          phone: '+77001234567',
        },
      };

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const tx = {
          trip: {
            findUnique: jest.fn().mockResolvedValue(mockTrip),
            update: jest.fn().mockResolvedValue(mockTrip),
          },
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
          payment: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      // Valid request without userId (should use authenticated user)
      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          tripId: 'trip123',
          seatsBooked: 2,
          passengers: [
            { name: 'John' },
            { name: 'Jane' }
          ],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.bookingId).toBe('booking123');
    });
  });

  describe('GET /api/bookings/shared - Access Control', () => {
    it('should only return authenticated user\'s bookings', async () => {
      const authenticatedUserId = 'user-123';

      // Mock valid token
      (extractBearerToken as jest.Mock).mockReturnValue('valid-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: authenticatedUserId,
        email: 'user@example.com',
        role: 'USER',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: authenticatedUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const mockBookings = [
        {
          id: 'booking1',
          userId: authenticatedUserId,
          tripId: 'trip1',
          seatsBooked: 2,
          totalAmount: 5000,
          currency: 'KZT',
          status: 'CONFIRMED',
          passengers: [],
          createdAt: new Date(),
          trip: {
            id: 'trip1',
            title: 'Trip 1',
            departureTime: new Date(),
            returnTime: null,
            originName: 'Almaty',
            destName: 'Astana',
            tripType: 'SHARED',
            totalSeats: 5,
            availableSeats: 3,
            pricePerSeat: 2500,
            status: 'PUBLISHED',
          },
          user: {
            id: authenticatedUserId,
            name: 'User',
            email: 'user@example.com',
            avatar: null,
          },
          payment: null,
        },
      ];

      (prisma.booking.count as jest.Mock).mockResolvedValue(1);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.bookings).toHaveLength(1);
      expect(data.data.bookings[0].userId).toBe(authenticatedUserId);
    });

    it('should not return other users\' bookings to regular users', async () => {
      const authenticatedUserId = 'user-123';
      const otherUserId = 'user-456';

      // Mock valid token for user-123
      (extractBearerToken as jest.Mock).mockReturnValue('valid-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: authenticatedUserId,
        email: 'user@example.com',
        role: 'USER',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: authenticatedUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      // Mock empty result (user has no bookings)
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      // Try to fetch other user's bookings
      const request = new NextRequest(
        `http://localhost:3000/api/bookings/shared?userId=${otherUserId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
          },
        }
      );

      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should return empty results, not other user's bookings
      expect(data.data.bookings).toHaveLength(0);
      
      // Verify the query was filtered by authenticated user, not requested user
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: authenticatedUserId, // Should use authenticated user
          }),
        })
      );
    });

    it('should allow admin users to query bookings by userId', async () => {
      const adminUserId = 'admin-123';
      const targetUserId = 'user-456';

      // Mock valid admin token
      (extractBearerToken as jest.Mock).mockReturnValue('admin-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: adminUserId,
        email: 'admin@example.com',
        role: 'ADMIN',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: adminUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const mockBookings = [
        {
          id: 'booking1',
          userId: targetUserId,
          tripId: 'trip1',
          seatsBooked: 2,
          totalAmount: 5000,
          currency: 'KZT',
          status: 'CONFIRMED',
          passengers: [],
          createdAt: new Date(),
          trip: {
            id: 'trip1',
            title: 'Trip 1',
            departureTime: new Date(),
            returnTime: null,
            originName: 'Almaty',
            destName: 'Astana',
            tripType: 'SHARED',
            totalSeats: 5,
            availableSeats: 3,
            pricePerSeat: 2500,
            status: 'PUBLISHED',
          },
          user: {
            id: targetUserId,
            name: 'Target User',
            email: 'target@example.com',
            avatar: null,
          },
          payment: null,
        },
      ];

      (prisma.booking.count as jest.Mock).mockResolvedValue(1);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      // Admin requesting specific user's bookings
      const request = new NextRequest(
        `http://localhost:3000/api/bookings/shared?userId=${targetUserId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.bookings).toHaveLength(1);
      expect(data.data.bookings[0].userId).toBe(targetUserId);
      
      // Verify admin can query specific user
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: targetUserId,
          }),
        })
      );
    });
  });

  describe('Integration - Complete Booking Flow Security', () => {
    it('should prevent booking forgery in complete flow', async () => {
      // Scenario: Attacker tries to create a booking for a victim
      // Expected: Request fails validation

      const attackerUserId = 'attacker-123';
      const victimUserId = 'victim-456';

      // Mock attacker's valid token
      (extractBearerToken as jest.Mock).mockReturnValue('attacker-token');
      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: attackerUserId,
        email: 'attacker@example.com',
        role: 'USER',
      });
      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session123',
        userId: attackerUserId,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      // Attacker tries to create booking with victim's userId
      const request = new NextRequest('http://localhost:3000/api/bookings/shared', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer attacker-token',
        },
        body: JSON.stringify({
          tripId: 'trip123',
          userId: victimUserId, // Malicious payload
          seatsBooked: 1,
          passengers: [{ name: 'Victim Name' }],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      // Should fail validation since userId is not accepted
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/validation/i);
    });
  });
});
