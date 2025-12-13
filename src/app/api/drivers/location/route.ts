import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// Get driver from session 
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { 
      user: true
    }
  });
  
  if (!driver || driver.user.role !== 'DRIVER') {
    throw new Error('Driver not found');
  }
  
  return driver;
}

// POST /api/drivers/location - Update driver location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, heading, speed, accuracy } = body;
    
    // Validate input
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude value' },
        { status: 400 }
      );
    }
    
    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude value' },
        { status: 400 }
      );
    }
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Update driver location using raw SQL (since DriverLocation model might not be available yet)
    try {
      await prisma.$executeRaw`
        INSERT INTO driver_locations (
          driver_id, 
          latitude, 
          longitude, 
          heading, 
          speed, 
          accuracy, 
          updated_at,
          created_at
        ) 
        VALUES (
          ${driver.userId}, 
          ${latitude}, 
          ${longitude}, 
          ${heading || 0}, 
          ${speed || 0}, 
          ${accuracy || 10}, 
          NOW(),
          NOW()
        )
        ON CONFLICT (driver_id) 
        DO UPDATE SET 
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          heading = EXCLUDED.heading,
          speed = EXCLUDED.speed,
          accuracy = EXCLUDED.accuracy,
          updated_at = NOW()
      `;
    } catch (locationError) {
      console.error('Location update error:', locationError);
      
      // Fallback: Create table if it doesn't exist
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS driver_locations (
            driver_id VARCHAR(255) PRIMARY KEY,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            heading INTEGER DEFAULT 0,
            speed INTEGER DEFAULT 0,
            accuracy INTEGER DEFAULT 10,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `;
        
        // Retry the insert
        await prisma.$executeRaw`
          INSERT INTO driver_locations (
            driver_id, latitude, longitude, heading, speed, accuracy, updated_at, created_at
          ) 
          VALUES (
            ${driver.userId}, ${latitude}, ${longitude}, ${heading || 0}, ${speed || 0}, ${accuracy || 10}, NOW(), NOW()
          )
          ON CONFLICT (driver_id) 
          DO UPDATE SET 
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            heading = EXCLUDED.heading,
            speed = EXCLUDED.speed,
            accuracy = EXCLUDED.accuracy,
            updated_at = NOW()
        `;
      } catch (fallbackError) {
        console.error('Fallback location update failed:', fallbackError);
        throw new Error('Could not update location');
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        driverId: driver.id,
        location: {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 10
        },
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found') {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// GET /api/drivers/location - Get current driver location
export async function GET(request: NextRequest) {
  try {
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Get current location
    const locationResult = await prisma.$queryRaw`
      SELECT 
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        updated_at
      FROM driver_locations 
      WHERE driver_id = ${driver.userId}
    ` as any[];
    
    if (locationResult.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          location: null,
          message: 'No location data available'
        }
      });
    }
    
    const location = locationResult[0];
    
    return NextResponse.json({
      success: true,
      data: {
        driverId: driver.id,
        location: {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          heading: Number(location.heading),
          speed: Number(location.speed),
          accuracy: Number(location.accuracy),
          updatedAt: location.updated_at
        }
      }
    });
    
  } catch (error) {
    console.error('Get location error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found') {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve location' },
      { status: 500 }
    );
  }
}

// PUT /api/drivers/location - Batch update multiple location points (for GPS tracking)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { locations } = body;
    
    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Locations array is required' },
        { status: 400 }
      );
    }
    
    if (locations.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 location points allowed per batch' },
        { status: 400 }
      );
    }
    
    // Get authenticated driver
    const driver = await getDriverFromRequest(request);
    
    // Process locations in chronological order
    const sortedLocations = locations
      .filter(loc => loc.latitude && loc.longitude && loc.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedLocations.length === 0) {
      return NextResponse.json(
        { error: 'No valid location points provided' },
        { status: 400 }
      );
    }
    
    // Use the most recent location for current position
    const currentLocation = sortedLocations[sortedLocations.length - 1];
    
    // Update current location
    await prisma.$executeRaw`
      INSERT INTO driver_locations (
        driver_id, 
        latitude, 
        longitude, 
        heading, 
        speed, 
        accuracy, 
        updated_at,
        created_at
      ) 
      VALUES (
        ${driver.userId}, 
        ${currentLocation.latitude}, 
        ${currentLocation.longitude}, 
        ${currentLocation.heading || 0}, 
        ${currentLocation.speed || 0}, 
        ${currentLocation.accuracy || 10}, 
        NOW(),
        NOW()
      )
      ON CONFLICT (driver_id) 
      DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        accuracy = EXCLUDED.accuracy,
        updated_at = NOW()
    `;
    
    return NextResponse.json({
      success: true,
      message: `Processed ${sortedLocations.length} location points`,
      data: {
        driverId: driver.id,
        processedCount: sortedLocations.length,
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: currentLocation.timestamp
        }
      }
    });
    
  } catch (error) {
    console.error('Batch location update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Driver not found') {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process location batch' },
      { status: 500 }
    );
  }
}
