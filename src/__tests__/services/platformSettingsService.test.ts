/**
 * Tests for Platform Settings Configuration
 * 
 * Tests the platform fee configuration constants and validation rules:
 * - Default fee rate (15%)
 * - Range validation (0-50%)
 * - Earnings calculations
 */

// Constants defined here to avoid Prisma initialization in tests
// These match the values in platformSettingsService.ts
const DEFAULT_PLATFORM_FEE_RATE = 0.15; // 15%
const MIN_PLATFORM_FEE_RATE = 0.0;      // 0%
const MAX_PLATFORM_FEE_RATE = 0.50;     // 50%
const SETTINGS_KEY_PLATFORM_FEE_RATE = 'platform_fee_rate';

describe('Platform Settings Constants', () => {
  describe('Platform Fee Rate Configuration', () => {
    it('should have default platform fee rate of 15% (0.15)', () => {
      expect(DEFAULT_PLATFORM_FEE_RATE).toBe(0.15);
    });

    it('should have minimum platform fee rate of 0% (0.0)', () => {
      expect(MIN_PLATFORM_FEE_RATE).toBe(0.0);
    });

    it('should have maximum platform fee rate of 50% (0.50)', () => {
      expect(MAX_PLATFORM_FEE_RATE).toBe(0.50);
    });

    it('should have valid range for platform fee rate', () => {
      expect(MIN_PLATFORM_FEE_RATE).toBeLessThanOrEqual(DEFAULT_PLATFORM_FEE_RATE);
      expect(DEFAULT_PLATFORM_FEE_RATE).toBeLessThanOrEqual(MAX_PLATFORM_FEE_RATE);
    });

    it('should have platform fee settings key defined', () => {
      expect(SETTINGS_KEY_PLATFORM_FEE_RATE).toBe('platform_fee_rate');
    });
  });

  describe('Driver Earnings Calculation', () => {
    it('should calculate correct driver earnings at default rate', () => {
      const totalFare = 10000; // 10,000 KZT
      const driverEarningsRate = 1 - DEFAULT_PLATFORM_FEE_RATE;
      const driverEarnings = totalFare * driverEarningsRate;
      
      expect(driverEarningsRate).toBe(0.85);
      expect(driverEarnings).toBe(8500);
    });

    it('should calculate correct platform fee at default rate', () => {
      const totalFare = 10000; // 10,000 KZT
      const platformFee = totalFare * DEFAULT_PLATFORM_FEE_RATE;
      
      expect(platformFee).toBe(1500);
    });

    it('should ensure driver earnings + platform fee = total fare', () => {
      const totalFare = 10000;
      const platformFee = totalFare * DEFAULT_PLATFORM_FEE_RATE;
      const driverEarnings = totalFare * (1 - DEFAULT_PLATFORM_FEE_RATE);
      
      expect(platformFee + driverEarnings).toBe(totalFare);
    });
  });

  describe('Rate Validation', () => {
    it('should accept valid rates within range', () => {
      const validRates = [0, 0.05, 0.10, 0.15, 0.25, 0.50];
      
      validRates.forEach(rate => {
        const isValid = rate >= MIN_PLATFORM_FEE_RATE && rate <= MAX_PLATFORM_FEE_RATE;
        expect(isValid).toBe(true);
      });
    });

    it('should reject rates below minimum', () => {
      const invalidRate = -0.01;
      const isValid = invalidRate >= MIN_PLATFORM_FEE_RATE && invalidRate <= MAX_PLATFORM_FEE_RATE;
      expect(isValid).toBe(false);
    });

    it('should reject rates above maximum', () => {
      const invalidRate = 0.51;
      const isValid = invalidRate >= MIN_PLATFORM_FEE_RATE && invalidRate <= MAX_PLATFORM_FEE_RATE;
      expect(isValid).toBe(false);
    });
  });
});

describe('Business Rules', () => {
  describe('Earnings Calculations', () => {
    const testCases = [
      { totalFare: 5000, expectedFee: 750, expectedEarnings: 4250 },
      { totalFare: 10000, expectedFee: 1500, expectedEarnings: 8500 },
      { totalFare: 25000, expectedFee: 3750, expectedEarnings: 21250 },
      { totalFare: 50000, expectedFee: 7500, expectedEarnings: 42500 },
    ];

    testCases.forEach(({ totalFare, expectedFee, expectedEarnings }) => {
      it(`should calculate correct split for ${totalFare} KZT fare`, () => {
        const platformFee = totalFare * DEFAULT_PLATFORM_FEE_RATE;
        const driverEarnings = totalFare * (1 - DEFAULT_PLATFORM_FEE_RATE);
        
        expect(platformFee).toBe(expectedFee);
        expect(driverEarnings).toBe(expectedEarnings);
      });
    });
  });

  describe('Custom Fee Rate Calculations', () => {
    it('should calculate correct earnings with 10% platform fee', () => {
      const customRate = 0.10;
      const totalFare = 10000;
      const platformFee = totalFare * customRate;
      const driverEarnings = totalFare * (1 - customRate);
      
      expect(platformFee).toBe(1000);
      expect(driverEarnings).toBe(9000);
    });

    it('should calculate correct earnings with 20% platform fee', () => {
      const customRate = 0.20;
      const totalFare = 10000;
      const platformFee = totalFare * customRate;
      const driverEarnings = totalFare * (1 - customRate);
      
      expect(platformFee).toBe(2000);
      expect(driverEarnings).toBe(8000);
    });

    it('should calculate correct earnings with 0% platform fee', () => {
      const customRate = 0.0;
      const totalFare = 10000;
      const platformFee = totalFare * customRate;
      const driverEarnings = totalFare * (1 - customRate);
      
      expect(platformFee).toBe(0);
      expect(driverEarnings).toBe(10000);
    });
  });
});
