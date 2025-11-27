import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminMiddleware';
import {
  getPlatformFeeRate,
  updatePlatformFeeRate,
  getAllSettings,
  MIN_PLATFORM_FEE_RATE,
  MAX_PLATFORM_FEE_RATE,
  SETTINGS_KEYS,
} from '@/lib/services/platformSettingsService';

// Force dynamic rendering since this route uses headers for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Get all platform settings (admin only)
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const platformFeeRate = await getPlatformFeeRate();
    const allSettings = await getAllSettings();

    return NextResponse.json({
      success: true,
      settings: {
        platformFeeRate: {
          key: SETTINGS_KEYS.PLATFORM_FEE_RATE,
          value: platformFeeRate,
          label: 'Platform Fee Rate',
          description: 'Platform fee is the percentage retained by StepperGO from each completed ride before paying the driver.',
          displayValue: `${Math.round(platformFeeRate * 100)}%`,
          minValue: MIN_PLATFORM_FEE_RATE,
          maxValue: MAX_PLATFORM_FEE_RATE,
          minDisplayValue: `${Math.round(MIN_PLATFORM_FEE_RATE * 100)}%`,
          maxDisplayValue: `${Math.round(MAX_PLATFORM_FEE_RATE * 100)}%`,
        },
      },
      allSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update platform settings (admin only)
 */
export async function PUT(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Missing setting key' },
        { status: 400 }
      );
    }

    // Handle platform fee rate update
    if (key === SETTINGS_KEYS.PLATFORM_FEE_RATE) {
      // Value should be a percentage (0-50) or decimal (0-0.5)
      let feeRate: number;
      
      if (typeof value === 'number') {
        // If value is > 1, assume it's a percentage and convert to decimal
        feeRate = value > 1 ? value / 100 : value;
      } else {
        return NextResponse.json(
          { error: 'Fee rate must be a number' },
          { status: 400 }
        );
      }

      // Validate range
      if (feeRate < MIN_PLATFORM_FEE_RATE || feeRate > MAX_PLATFORM_FEE_RATE) {
        return NextResponse.json(
          {
            error: `Fee rate must be between ${Math.round(MIN_PLATFORM_FEE_RATE * 100)}% and ${Math.round(MAX_PLATFORM_FEE_RATE * 100)}%`,
          },
          { status: 400 }
        );
      }

      // TODO: Extract actual admin user ID from authenticated session
      // Currently using placeholder for development - the requireAdmin middleware
      // already validates the user is an admin, but we need to properly extract the ID
      // from the session/JWT token when production auth is implemented
      const adminUserId = 'admin'; // Placeholder - to be replaced with session user ID

      const result = await updatePlatformFeeRate(feeRate, adminUserId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Platform fee rate updated to ${Math.round(feeRate * 100)}%`,
        setting: {
          key: SETTINGS_KEYS.PLATFORM_FEE_RATE,
          value: feeRate,
          displayValue: `${Math.round(feeRate * 100)}%`,
        },
      });
    }

    return NextResponse.json(
      { error: `Unknown setting key: ${key}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
