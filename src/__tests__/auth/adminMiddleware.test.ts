/**
 * Admin Middleware Tests
 * 
 * These tests verify that:
 * 1. Unauthenticated users cannot access admin routes
 * 2. Non-admin users cannot access admin routes
 * 3. Only users with ADMIN role can access admin routes
 */
import { NextRequest, NextResponse } from 'next/server';

// Mock the prisma client before importing the middleware
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    session: {
      findFirst: jest.fn(),
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

import { requireAdmin } from '@/lib/auth/adminMiddleware';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';

const mockVerifyAccessToken = verifyAccessToken as jest.Mock;
const mockFindFirst = (prisma.session.findFirst as jest.Mock);

describe('adminMiddleware - requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication checks', () => {
    it('should return 401 when no authorization header or cookie is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body.error).toBe('Unauthorized - No authentication provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body.error).toBe('Invalid token');
      expect(body.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 when token is expired', async () => {
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Token has expired');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer expired-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body.error).toBe('Token expired');
      expect(body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Authorization checks (role validation)', () => {
    it('should return 403 when user is a PASSENGER (not admin)', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'passenger@example.com',
        role: 'PASSENGER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-passenger-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
      const body = await response?.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    it('should return 403 when user is a DRIVER (not admin)', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'driver-123',
        email: 'driver@example.com',
        role: 'DRIVER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-driver-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
      const body = await response?.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    it('should return 403 when user is an ACTIVITY_OWNER (not admin)', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'activity-owner-123',
        email: 'activity-owner@example.com',
        role: 'ACTIVITY_OWNER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-activity-owner-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
      const body = await response?.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });
  });

  describe('Valid admin access', () => {
    it('should return null (allow access) when user has ADMIN role', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
        },
      });

      const response = await requireAdmin(request);

      // Null means the request is authorized to proceed
      expect(response).toBeNull();
    });

    it('should validate session when sessionId is present in token', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        sessionId: 'session-123',
      });

      mockFindFirst.mockResolvedValue({
        id: 'session-id',
        userId: 'admin-123',
        token: 'session-123',
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).toBeNull();
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          userId: 'admin-123',
          token: 'session-123',
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('should return 401 when session is expired or revoked', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        sessionId: 'session-123',
      });

      // Session not found (expired or revoked)
      mockFindFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-admin-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body.error).toBe('Session expired or invalid');
    });
  });

  describe('Token extraction from different sources', () => {
    it('should accept token from access_token cookie when no Authorization header', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Cookie': 'access_token=valid-admin-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).toBeNull();
    });
  });

  describe('No DEV MODE bypass', () => {
    it('should NOT allow unauthenticated access regardless of environment', async () => {
      // This test ensures the DEV MODE bypass has been removed
      // Even with any environment variable, unauthenticated requests should be rejected
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT allow non-admin access regardless of environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockVerifyAccessToken.mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'PASSENGER',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const response = await requireAdmin(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
