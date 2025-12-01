/**
 * Admin Routes Security Tests
 * 
 * These tests verify that all admin API routes properly enforce authentication
 * and authorization using the requireAdmin middleware.
 * 
 * Previously, some routes used insecure header-based authentication:
 * - /api/admin/payouts/run used x-admin-token header
 * - /api/admin/drivers/availability used x-admin-id header
 * 
 * This test suite verifies that these routes now use proper JWT authentication
 * with ADMIN role validation.
 */
import { NextRequest } from 'next/server';

// Mock PrismaClient before any imports
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      session: {
        findFirst: jest.fn(),
      },
      payout: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      driver: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      driverAvailabilitySchedule: {
        count: jest.fn(),
      },
      driverAvailabilityHistory: {
        findMany: jest.fn(),
      },
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
    payout: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    driver: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    driverAvailabilitySchedule: {
      count: jest.fn(),
    },
    driverAvailabilityHistory: {
      findMany: jest.fn(),
    },
  },
  prisma: {
    session: {
      findFirst: jest.fn(),
    },
    payout: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

// Mock jwt functions
jest.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: jest.fn(),
  extractBearerToken: jest.fn((header: string | null) => {
    if (!header || !header.startsWith('Bearer ')) {
      return null;
    }
    return header.substring(7);
  }),
}));

// Mock payout service
jest.mock('@/lib/services/driverPayoutService', () => ({
  runBatchPayout: jest.fn(),
  runDriverPayout: jest.fn(),
  MockPayoutAdapter: jest.fn().mockImplementation(() => ({})),
}));

import { verifyAccessToken } from '@/lib/auth/jwt';
import { GET as getPayoutsRun, POST as postPayoutsRun } from '@/app/api/admin/payouts/run/route';
import { GET as getDriverAvailability } from '@/app/api/admin/drivers/availability/route';

const mockVerifyAccessToken = verifyAccessToken as jest.Mock;

describe('Admin Routes Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/payouts/run', () => {
    it('should return 401 when no authentication is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await postPayoutsRun(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 401 when using the old x-admin-token header (insecure method)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'POST',
        headers: {
          'x-admin-token': 'some-token',
        },
        body: JSON.stringify({}),
      });

      const response = await postPayoutsRun(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 403 when user is not an admin', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'PASSENGER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      });

      const response = await postPayoutsRun(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    it('should return 403 when DRIVER tries to access', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'driver-123',
        email: 'driver@example.com',
        role: 'DRIVER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      });

      const response = await postPayoutsRun(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });
  });

  describe('GET /api/admin/payouts/run', () => {
    it('should return 401 when no authentication is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'GET',
      });

      const response = await getPayoutsRun(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 401 when using the old x-admin-token header (insecure method)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'GET',
        headers: {
          'x-admin-token': 'some-token',
        },
      });

      const response = await getPayoutsRun(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 403 when user is not an admin', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'PASSENGER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await getPayoutsRun(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });
  });

  describe('GET /api/admin/drivers/availability', () => {
    it('should return 401 when no authentication is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 401 when using the old x-admin-id header (insecure method)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
        headers: {
          'x-admin-id': 'some-admin-id',
        },
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 403 when user is not an admin', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'PASSENGER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    it('should return 403 when DRIVER tries to access', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'driver-123',
        email: 'driver@example.com',
        role: 'DRIVER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    it('should return 403 when ACTIVITY_OWNER tries to access', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'activity-owner-123',
        email: 'activity-owner@example.com',
        role: 'ACTIVITY_OWNER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });
  });

  describe('Security: No environment bypass', () => {
    it('should not allow access in development mode without proper auth (payouts)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/api/admin/payouts/run', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await postPayoutsRun(request);

      expect(response.status).toBe(401);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not allow access in development mode without proper auth (availability)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/api/admin/drivers/availability', {
        method: 'GET',
      });

      const response = await getDriverAvailability(request);

      expect(response.status).toBe(401);
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
