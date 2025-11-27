/**
 * Platform Settings Service
 * 
 * Manages configurable platform-wide settings stored in the database.
 * Provides caching and validation for settings like platform fee rate.
 */

import { prisma } from '@/lib/prisma';

// Default values for platform settings
export const DEFAULT_PLATFORM_FEE_RATE = 0.15; // 15%
export const MIN_PLATFORM_FEE_RATE = 0.0;      // 0%
export const MAX_PLATFORM_FEE_RATE = 0.50;     // 50%

// Setting keys
export const SETTINGS_KEYS = {
  PLATFORM_FEE_RATE: 'platform_fee_rate',
} as const;

// In-memory cache for performance
let platformFeeRateCache: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Get the current platform fee rate from the database
 * Falls back to default if not set
 */
export async function getPlatformFeeRate(): Promise<number> {
  // Check cache first
  if (platformFeeRateCache !== null && cacheTimestamp !== null) {
    const cacheAge = Date.now() - cacheTimestamp;
    if (cacheAge < CACHE_TTL_MS) {
      return platformFeeRateCache;
    }
  }

  try {
    const setting = await prisma.platformSettings.findUnique({
      where: { key: SETTINGS_KEYS.PLATFORM_FEE_RATE },
    });

    if (setting) {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && value >= MIN_PLATFORM_FEE_RATE && value <= MAX_PLATFORM_FEE_RATE) {
        // Update cache
        platformFeeRateCache = value;
        cacheTimestamp = Date.now();
        return value;
      }
    }

    // Fall back to default
    platformFeeRateCache = DEFAULT_PLATFORM_FEE_RATE;
    cacheTimestamp = Date.now();
    return DEFAULT_PLATFORM_FEE_RATE;
  } catch (error) {
    console.error('Error fetching platform fee rate:', error);
    // Return default on error
    return DEFAULT_PLATFORM_FEE_RATE;
  }
}

/**
 * Get the driver earnings rate (inverse of platform fee)
 */
export async function getDriverEarningsRate(): Promise<number> {
  const platformFeeRate = await getPlatformFeeRate();
  return 1 - platformFeeRate;
}

/**
 * Update the platform fee rate
 * @param newRate - The new fee rate (0-0.50)
 * @param updatedBy - The user ID who made the update
 */
export async function updatePlatformFeeRate(
  newRate: number,
  updatedBy?: string
): Promise<{ success: boolean; value?: number; error?: string }> {
  // Validate the rate
  if (typeof newRate !== 'number' || isNaN(newRate)) {
    return { success: false, error: 'Invalid fee rate: must be a number' };
  }

  if (newRate < MIN_PLATFORM_FEE_RATE || newRate > MAX_PLATFORM_FEE_RATE) {
    return {
      success: false,
      error: `Fee rate must be between ${MIN_PLATFORM_FEE_RATE * 100}% and ${MAX_PLATFORM_FEE_RATE * 100}%`,
    };
  }

  try {
    const result = await prisma.platformSettings.upsert({
      where: { key: SETTINGS_KEYS.PLATFORM_FEE_RATE },
      update: {
        value: newRate.toString(),
        updatedBy,
      },
      create: {
        key: SETTINGS_KEYS.PLATFORM_FEE_RATE,
        value: newRate.toString(),
        label: 'Platform Fee Rate',
        description: 'Platform fee is the percentage retained by StepperGO from each completed ride before paying the driver.',
        valueType: 'number',
        minValue: MIN_PLATFORM_FEE_RATE,
        maxValue: MAX_PLATFORM_FEE_RATE,
        updatedBy,
      },
    });

    // Invalidate cache
    platformFeeRateCache = newRate;
    cacheTimestamp = Date.now();

    return { success: true, value: parseFloat(result.value) };
  } catch (error) {
    console.error('Error updating platform fee rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update platform fee rate',
    };
  }
}

/**
 * Get all platform settings
 */
export async function getAllSettings(): Promise<
  Array<{
    key: string;
    value: string;
    label: string;
    description: string | null;
    valueType: string;
    minValue: number | null;
    maxValue: number | null;
    updatedAt: Date;
    updatedBy: string | null;
  }>
> {
  try {
    const settings = await prisma.platformSettings.findMany({
      orderBy: { key: 'asc' },
    });
    return settings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return [];
  }
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  try {
    // Check if platform fee rate exists
    const existingSetting = await prisma.platformSettings.findUnique({
      where: { key: SETTINGS_KEYS.PLATFORM_FEE_RATE },
    });

    if (!existingSetting) {
      await prisma.platformSettings.create({
        data: {
          key: SETTINGS_KEYS.PLATFORM_FEE_RATE,
          value: DEFAULT_PLATFORM_FEE_RATE.toString(),
          label: 'Platform Fee Rate',
          description: 'Platform fee is the percentage retained by StepperGO from each completed ride before paying the driver.',
          valueType: 'number',
          minValue: MIN_PLATFORM_FEE_RATE,
          maxValue: MAX_PLATFORM_FEE_RATE,
        },
      });
      console.log('Initialized default platform fee rate setting');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  platformFeeRateCache = null;
  cacheTimestamp = null;
}

/**
 * Calculate driver earnings from a booking amount
 * Uses the configured platform fee rate
 */
export async function calculateDriverEarningsFromBooking(bookingAmount: number): Promise<{
  grossAmount: number;
  platformFee: number;
  driverEarnings: number;
  platformFeeRate: number;
}> {
  const platformFeeRate = await getPlatformFeeRate();
  const grossAmount = bookingAmount;
  const platformFee = Math.round(grossAmount * platformFeeRate);
  const driverEarnings = grossAmount - platformFee;

  return {
    grossAmount,
    platformFee,
    driverEarnings,
    platformFeeRate,
  };
}
