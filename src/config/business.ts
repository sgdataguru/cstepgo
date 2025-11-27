/**
 * Business Configuration
 * Centralized configuration for business rules and pricing
 * 
 * Note: The platform fee rate is now configurable via the Admin Portal.
 * Use getPlatformFeeRate() from platformSettingsService for the actual value.
 * The constants here are defaults/fallbacks.
 */

import {
  getPlatformFeeRate as getConfiguredPlatformFeeRate,
  getDriverEarningsRate as getConfiguredDriverEarningsRate,
  DEFAULT_PLATFORM_FEE_RATE,
} from '@/lib/services/platformSettingsService';

export const BUSINESS_CONFIG = {
  /**
   * Platform fee as a percentage of the base fare
   * This fee is charged on top of the base fare
   * NOTE: This is the DEFAULT value. The actual value is stored in the database.
   */
  PLATFORM_FEE_RATE: DEFAULT_PLATFORM_FEE_RATE, // 15%

  /**
   * Driver earnings percentage of total amount
   * Total = Base Fare + Platform Fee
   * Driver receives (1 - PLATFORM_FEE_RATE) of total
   * NOTE: This is the DEFAULT value. The actual value is derived from the database.
   */
  DRIVER_EARNINGS_RATE: 1 - DEFAULT_PLATFORM_FEE_RATE, // 85%

  /**
   * Tax rate (currently 0 as tax is included in the total)
   * Future: May need to be extracted separately for tax reporting
   */
  TAX_RATE: 0.0, // 0%

  /**
   * Default currency
   */
  DEFAULT_CURRENCY: 'KZT',

  /**
   * Receipt Configuration
   */
  RECEIPT: {
    /**
     * Receipt number prefix
     */
    PREFIX: 'RCP',

    /**
     * Company information for receipts
     */
    COMPANY_NAME: 'StepperGO',
    SUPPORT_EMAIL: 'support@steppergo.com',
  },
} as const;

/**
 * Get the current platform fee rate from database configuration
 * Falls back to default if not configured
 */
export async function getPlatformFeeRateAsync(): Promise<number> {
  return await getConfiguredPlatformFeeRate();
}

/**
 * Get the current driver earnings rate from database configuration
 * This is the inverse of the platform fee rate
 */
export async function getDriverEarningsRateAsync(): Promise<number> {
  return await getConfiguredDriverEarningsRate();
}

/**
 * Calculate platform fee (sync version using default rate)
 */
export function calculatePlatformFee(baseAmount: number): number {
  return baseAmount * BUSINESS_CONFIG.PLATFORM_FEE_RATE;
}

/**
 * Calculate platform fee (async version using configured rate)
 */
export async function calculatePlatformFeeAsync(baseAmount: number): Promise<number> {
  const rate = await getConfiguredPlatformFeeRate();
  return baseAmount * rate;
}

/**
 * Calculate total amount with platform fee
 */
export function calculateTotalAmount(baseAmount: number): number {
  return baseAmount + calculatePlatformFee(baseAmount);
}

/**
 * Calculate total amount with platform fee (async version)
 */
export async function calculateTotalAmountAsync(baseAmount: number): Promise<number> {
  const fee = await calculatePlatformFeeAsync(baseAmount);
  return baseAmount + fee;
}

/**
 * Calculate driver earnings from total amount (sync version using default rate)
 */
export function calculateDriverEarnings(totalAmount: number): number {
  return totalAmount * BUSINESS_CONFIG.DRIVER_EARNINGS_RATE;
}

/**
 * Calculate driver earnings from total amount (async version using configured rate)
 */
export async function calculateDriverEarningsAsync(totalAmount: number): Promise<number> {
  const rate = await getConfiguredDriverEarningsRate();
  return totalAmount * rate;
}
