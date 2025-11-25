/**
 * Business Configuration
 * Centralized configuration for business rules and pricing
 */

export const BUSINESS_CONFIG = {
  /**
   * Platform fee as a percentage of the base fare
   * This fee is charged on top of the base fare
   */
  PLATFORM_FEE_RATE: 0.15, // 15%

  /**
   * Driver earnings percentage of total amount
   * Total = Base Fare + Platform Fee
   * Driver receives 85% of total
   */
  DRIVER_EARNINGS_RATE: 0.85, // 85%

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
 * Calculate platform fee
 */
export function calculatePlatformFee(baseAmount: number): number {
  return baseAmount * BUSINESS_CONFIG.PLATFORM_FEE_RATE;
}

/**
 * Calculate total amount with platform fee
 */
export function calculateTotalAmount(baseAmount: number): number {
  return baseAmount + calculatePlatformFee(baseAmount);
}

/**
 * Calculate driver earnings from total amount
 */
export function calculateDriverEarnings(totalAmount: number): number {
  return totalAmount * BUSINESS_CONFIG.DRIVER_EARNINGS_RATE;
}
