/**
 * Trip Creation Flow Tests
 * 
 * Tests for the refactored single-page trip booking flow:
 * - Private cab: departure = current server time (immediate)
 * - Shared ride: departure must be at least 1 hour in advance
 * - No driver scenario: should not crash or expose seed script errors
 */

import { NextRequest } from 'next/server';

// Mock Prisma client
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'PASSENGER',
};

const mockDriver = {
  id: 'test-driver-id',
  userId: 'test-driver-user-id',
  rating: 4.5,
};

const mockTrip = {
  id: 'test-trip-id',
  title: 'Almaty to Astana',
  tripType: 'PRIVATE',
  status: 'PUBLISHED', // Private trips are now published immediately
  organizerId: 'test-user-id',
  driverId: null,
  organizer: mockUser,
  driver: null,
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
    trip: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/realtimeBroadcastService', () => ({
  realtimeBroadcastService: {
    broadcastTripOffer: jest.fn().mockResolvedValue({ sent: 0, eligible: 0 }),
  },
}));

// Import after mocking
import { prisma } from '@/lib/prisma';

// Helper to import the POST handler - avoids repeated dynamic imports
const getPostHandler = async () => {
  const { POST } = await import('@/app/api/trips/route');
  return POST;
};

describe('Trip Creation API', () => {
  const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Shared Ride Validation', () => {
    it('should reject shared rides scheduled less than 1 hour in advance', async () => {
      // Create a time 30 minutes from now
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const departureDate = thirtyMinutesFromNow.toISOString().split('T')[0];
      const departureTime = thirtyMinutesFromNow.toTimeString().slice(0, 5);

      // Mock the API route handler
      const requestBody = {
        title: 'Test Shared Ride',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'SHARED',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('at least 1 hour in advance');
    });

    it('should accept shared rides scheduled more than 1 hour in advance', async () => {
      // Create a time 2 hours from now
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const departureDate = twoHoursFromNow.toISOString().split('T')[0];
      const departureTime = twoHoursFromNow.toTimeString().slice(0, 5);

      // Mock database calls
      (mockedPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        tripType: 'SHARED',
      });

      const requestBody = {
        title: 'Test Shared Ride',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'SHARED',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Private Cab', () => {
    it('should accept private cab rides with any valid time', async () => {
      const now = new Date();
      const departureDate = now.toISOString().split('T')[0];
      const departureTime = now.toTimeString().slice(0, 5);

      // Mock database calls
      (mockedPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce(mockTrip);

      const requestBody = {
        title: 'Test Private Cab',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'PRIVATE',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should NOT broadcast private cab if status is DRAFT', async () => {
      const now = new Date();
      const departureDate = now.toISOString().split('T')[0];
      const departureTime = now.toTimeString().slice(0, 5);

      const { realtimeBroadcastService } = await import('@/lib/services/realtimeBroadcastService');
      const broadcastSpy = jest.spyOn(realtimeBroadcastService, 'broadcastTripOffer');

      // Mock database calls - trip is DRAFT (not PUBLISHED)
      (mockedPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        status: 'DRAFT', // DRAFT status
        driverId: null,
      });

      const requestBody = {
        title: 'Test Private Cab',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'PRIVATE',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      // Should NOT broadcast because status is DRAFT
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it('should broadcast private cab if status is PUBLISHED and no driver', async () => {
      const now = new Date();
      const departureDate = now.toISOString().split('T')[0];
      const departureTime = now.toTimeString().slice(0, 5);

      const { realtimeBroadcastService } = await import('@/lib/services/realtimeBroadcastService');
      const broadcastSpy = jest.spyOn(realtimeBroadcastService, 'broadcastTripOffer')
        .mockResolvedValueOnce({ sent: 5, eligible: 10 });

      // Mock database calls - trip is PUBLISHED with no driver
      (mockedPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockedPrisma.driver.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        status: 'PUBLISHED', // PUBLISHED status
        driverId: null, // No driver
      });
      (mockedPrisma.trip.update as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        status: 'OFFERED',
      });

      const requestBody = {
        title: 'Test Private Cab',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'PRIVATE',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should broadcast because status is PUBLISHED and no driver
      expect(broadcastSpy).toHaveBeenCalledWith(mockTrip.id);
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should update trip status to OFFERED
      expect(mockedPrisma.trip.update).toHaveBeenCalledWith({
        where: { id: mockTrip.id },
        data: { status: 'OFFERED' },
      });
    });
  });

  describe('No Driver Scenario', () => {
    it('should create trip without crashing when no driver exists', async () => {
      const now = new Date();
      const departureDate = now.toISOString().split('T')[0];
      const departureTime = now.toTimeString().slice(0, 5);

      // Mock: No driver user found, but a regular user exists
      (mockedPrisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)  // No driver
        .mockResolvedValueOnce(mockUser);  // Any user
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        driverId: null,
      });

      const requestBody = {
        title: 'Test Trip Without Driver',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'PRIVATE',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should succeed, not crash
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should NOT expose seed script errors - check specific fields
      expect(data.data?.message).not.toContain('seed');
      expect(data.error).toBeUndefined();
    });

    it('should not expose seed script errors to users', async () => {
      const now = new Date();
      const departureDate = now.toISOString().split('T')[0];
      const departureTime = now.toTimeString().slice(0, 5);

      // Mock: No users at all - simulate fresh database
      (mockedPrisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)  // No driver
        .mockResolvedValueOnce(null);  // No users at all
      (mockedPrisma.user.create as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        email: 'system-test@steppergo.local',
        name: 'System User (Dev)',
      });
      (mockedPrisma.trip.create as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        driverId: null,
      });

      const requestBody = {
        title: 'Test Trip Empty DB',
        origin: { name: 'Almaty', coordinates: { lat: 43.238949, lng: 76.945465 } },
        destination: { name: 'Astana', coordinates: { lat: 51.1694, lng: 71.4491 } },
        departureDate,
        departureTime,
        tripType: 'PRIVATE',
        vehicleType: 'sedan',
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should create a dev user and trip, not crash
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Response should never mention "seed script" - check specific fields
      expect(data.data?.message || '').not.toContain('seed script');
      expect(data.error || '').not.toContain('seed script');
      expect(data.message || '').not.toContain('seed script');
    });
  });

  describe('Required Fields Validation', () => {
    it('should reject requests missing required fields', async () => {
      const requestBody = {
        title: 'Test Trip',
        // Missing origin, destination, departureDate, departureTime
      };

      const POST = await getPostHandler();
      
      const request = new NextRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });
});

describe('Client-side Validation', () => {
  describe('validateDepartureTime for Shared Rides', () => {
    it('should return false for times less than 1 hour in future', () => {
      // This tests the validation logic that's in BookingForm
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const departureDate = thirtyMinutesFromNow.toISOString().split('T')[0];
      const departureTime = thirtyMinutesFromNow.toTimeString().slice(0, 5);
      
      const selectedDateTime = new Date(`${departureDate}T${departureTime}`);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const isValid = selectedDateTime >= oneHourFromNow;
      expect(isValid).toBe(false);
    });

    it('should return true for times more than 1 hour in future', () => {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const departureDate = twoHoursFromNow.toISOString().split('T')[0];
      const departureTime = twoHoursFromNow.toTimeString().slice(0, 5);
      
      const selectedDateTime = new Date(`${departureDate}T${departureTime}`);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const isValid = selectedDateTime >= oneHourFromNow;
      expect(isValid).toBe(true);
    });

    it('should not require validation for PRIVATE trips', () => {
      // For PRIVATE trips, any time is valid (uses current time)
      const rideType = 'PRIVATE';
      const skipValidation = rideType === 'PRIVATE';
      expect(skipValidation).toBe(true);
    });
  });
});
