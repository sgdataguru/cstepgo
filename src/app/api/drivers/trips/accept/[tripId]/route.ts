import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';
import { authenticateDriver, verifyTripAvailableForAcceptance } from '@/lib/auth/driverAuth';

// POST /api/drivers/trips/accept/[tripId] - Accept a trip
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Verify trip is available for acceptance
    await verifyTripAvailableForAcceptance(tripId);
    
    // Check if driver is available
    if (driver.availability !== 'AVAILABLE') {
      return NextResponse.json(
        { 
          error: 'Driver is not available',
          currentStatus: driver.availability 
        },
        { status: 400 }
      );
    }
    
    // Use database transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx: any) => {
      // Get the trip and check if it's still available
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'PENDING']
              }
            },
            select: {
              seatsBooked: true
            }
          }
        }
      });
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      // Double-check trip availability (redundant check for safety)
      if (trip.status !== 'PUBLISHED') {
        throw new Error('Trip is not available for booking');
      }
      
      if (trip.driverId) {
        throw new Error('Trip has already been accepted by another driver');
      }
      
      // Check if trip has available seats
      const totalBookedSeats = trip.bookings.reduce(
        (sum: number, booking: any) => sum + booking.seatsBooked,
        0
      );
      const availableSeats = trip.totalSeats - totalBookedSeats;
      
      if (availableSeats <= 0) {
        throw new Error('Trip has no available seats');
      }
      
      // Check if trip is in the future
      if (new Date(trip.departureTime) <= new Date()) {
        throw new Error('Cannot accept past trips');
      }
      
      // Assign driver to trip
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          driverId: driver.id,
          status: 'IN_PROGRESS'
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      // Update driver availability to BUSY
      await tx.driver.update({
        where: { id: driver.id },
        data: {
          availability: 'BUSY'
        }
      });
      
      // Confirm all pending bookings for this trip
      const pendingBookings = await tx.booking.findMany({
        where: {
          tripId: tripId,
          status: 'PENDING'
        }
      });
      
      if (pendingBookings.length > 0) {
        await tx.booking.updateMany({
          where: {
            tripId: tripId,
            status: 'PENDING'
          },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date()
          }
        });
      }
      
      // Record the acceptance in trip visibility (for analytics)
      // Note: Using raw query since TripDriverVisibility might not be available in Prisma yet
      try {
        await tx.$executeRaw`
          INSERT INTO trip_driver_visibility (trip_id, driver_id, response_action, response_at, created_at)
          VALUES (${tripId}, ${driver.userId}, 'accepted', NOW(), NOW())
          ON CONFLICT (trip_id, driver_id) 
          DO UPDATE SET 
            response_action = 'accepted',
            response_at = NOW()
        `;
      } catch (visibilityError) {
        console.warn('Could not record trip visibility:', visibilityError);
        // Continue execution - this is not critical
      }
      
      return {
        trip: updatedTrip,
        driver: driver
      };
    });
    
    // Calculate estimated earnings
    const estimatedEarnings = (Number(result.trip.basePrice) + Number(result.trip.platformFee)) * 0.85;
    
    // Broadcast trip status update to passengers
    try {
      await realtimeBroadcastService.broadcastTripStatusUpdate(
        tripId,
        'PUBLISHED',
        'IN_PROGRESS',
        driver.user.name,
        'Driver has accepted your trip and will be contacting you shortly'
      );
    } catch (broadcastError) {
      console.error('Failed to broadcast trip acceptance:', broadcastError);
      // Don't fail the acceptance if broadcast fails
    }
    
    // Prepare response data
    const responseData = {
      success: true,
      message: 'Trip accepted successfully!',
      data: {
        trip: {
          id: result.trip.id,
          title: result.trip.title,
          description: result.trip.description,
          departureTime: result.trip.departureTime,
          returnTime: result.trip.returnTime,
          originName: result.trip.originName,
          originAddress: result.trip.originAddress,
          destName: result.trip.destName,
          destAddress: result.trip.destAddress,
          totalSeats: result.trip.totalSeats,
          basePrice: result.trip.basePrice,
          platformFee: result.trip.platformFee,
          estimatedEarnings: Math.round(estimatedEarnings),
          status: result.trip.status,
          organizer: result.trip.organizer
        },
        driver: {
          id: driver.id,
          availability: 'BUSY',
          vehicleType: driver.vehicleType,
          vehicleMake: driver.vehicleMake,
          vehicleModel: driver.vehicleModel,
          licensePlate: driver.licensePlate
        },
        nextSteps: [
          'Navigate to pickup location',
          'Contact customer if needed',
          'Update trip status when you arrive',
          'Complete the trip when finished'
        ]
      }
    };
    
    return NextResponse.json(responseData, { status: 200 });
    
  } catch (error) {
    console.error('Trip acceptance error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found' || error.message === 'Driver not approved') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('already been accepted') ||
        error.message.includes('no available seats') ||
        error.message.includes('Cannot accept past trips')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to accept trip. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE /api/drivers/trips/accept/[tripId] - Cancel trip acceptance (if just accepted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Use database transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Get the trip and verify driver ownership
      const trip = await tx.trip.findUnique({
        where: { id: tripId }
      });
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      if (trip.driverId !== driver.id) {
        throw new Error('You are not assigned to this trip');
      }
      
      if (trip.status !== 'IN_PROGRESS') {
        throw new Error('Cannot cancel trip - trip status is not in progress');
      }
      
      // Check if trip hasn't started yet (allow cancellation only before departure)
      const now = new Date();
      const departureTime = new Date(trip.departureTime);
      const timeDifferenceMinutes = (departureTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (timeDifferenceMinutes < 15) {
        throw new Error('Cannot cancel trip - less than 15 minutes until departure');
      }
      
      // Remove driver assignment
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          driverId: null,
          status: 'PUBLISHED' // Return to published status
        }
      });
      
      // Update driver availability back to AVAILABLE
      await tx.driver.update({
        where: { id: driver.id },
        data: {
          availability: 'AVAILABLE'
        }
      });
      
      // Update trip visibility record
      try {
        await tx.$executeRaw`
          UPDATE trip_driver_visibility 
          SET response_action = 'cancelled', response_at = NOW()
          WHERE trip_id = ${tripId} AND driver_id = ${driver.userId}
        `;
      } catch (visibilityError) {
        console.warn('Could not update trip visibility:', visibilityError);
      }
      
      return updatedTrip;
    });
    
    return NextResponse.json({
      success: true,
      message: 'Trip acceptance cancelled successfully',
      data: {
        tripId: result.id,
        status: result.status,
        driverStatus: 'AVAILABLE'
      }
    });
    
  } catch (error) {
    console.error('Trip cancellation error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (
        error.message.includes('not found') ||
        error.message.includes('not assigned') ||
        error.message.includes('Cannot cancel')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel trip acceptance' },
      { status: 500 }
    );
  }
}

// GET /api/drivers/trips/accept/[tripId] - Get trip details for acceptance
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Authenticate driver using secure token validation
    const driver = await authenticateDriver(request);
    
    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          select: {
            id: true,
            seatsBooked: true,
            passengers: true,
            notes: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    // Calculate distance from driver (using default Almaty location for now)
    const driverLat = 43.2381;
    const driverLng = 76.9452;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (trip.originLat - driverLat) * Math.PI / 180;
    const dLng = (trip.originLng - driverLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLat * Math.PI / 180) * Math.cos(trip.originLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Calculate earnings and availability
    const estimatedEarnings = (Number(trip.basePrice) + Number(trip.platformFee)) * 0.85;
    const totalBookedSeats = trip.bookings.reduce(
      (sum: number, booking: any) => sum + booking.seatsBooked,
      0
    );
    const availableSeats = trip.totalSeats - totalBookedSeats;
    
    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          departureTime: trip.departureTime,
          returnTime: trip.returnTime,
          originName: trip.originName,
          originAddress: trip.originAddress,
          destName: trip.destName,
          destAddress: trip.destAddress,
          totalSeats: trip.totalSeats,
          availableSeats: availableSeats,
          basePrice: trip.basePrice,
          platformFee: trip.platformFee,
          estimatedEarnings: Math.round(estimatedEarnings),
          distance: Math.round(distance * 100) / 100,
          estimatedDuration: Math.round(distance * 1.5), // minutes
          organizer: trip.organizer,
          bookings: trip.bookings,
          status: trip.status,
          isAvailable: trip.status === 'PUBLISHED' && !trip.driverId && availableSeats > 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get trip details error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve trip details' },
      { status: 500 }
    );
  }
}
