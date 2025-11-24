import { NextRequest, NextResponse } from 'next/server';
import { DriverAvailabilityService } from '@/lib/services/driverAvailabilityService';

/**
 * Cron endpoint to run driver availability maintenance tasks
 * 
 * This endpoint should be called periodically (recommended: every 5 minutes)
 * by a cron service like Vercel Cron, GitHub Actions, or external cron service.
 * 
 * Security: In production, this should be protected by:
 * 1. Vercel Cron secret verification
 * 2. API key authentication
 * 3. IP whitelist
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, always require authentication
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && !cronSecret) {
      console.error('CRON_SECRET not configured in production environment');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Run maintenance tasks
    const result = await DriverAvailabilityService.runMaintenanceTasks();
    
    return NextResponse.json({
      success: true,
      message: 'Availability maintenance tasks completed',
      data: result
    });
    
  } catch (error) {
    console.error('Availability maintenance cron error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run availability maintenance tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
