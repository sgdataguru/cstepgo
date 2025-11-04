/**
 * Price formatting utilities
 * Handles currency formatting and price display
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  position: 'before' | 'after';
}

// Supported currencies
export const CURRENCIES: Record<string, CurrencyConfig> = {
  KZT: {
    code: 'KZT',
    symbol: '₸',
    decimals: 0,
    position: 'after',
  },
  KGS: {
    code: 'KGS',
    symbol: 'с',
    decimals: 0,
    position: 'after',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
    position: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    decimals: 2,
    position: 'after',
  },
};

/**
 * Format price with currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KZT',
  options: {
    showDecimals?: boolean;
    showSymbol?: boolean;
    showCode?: boolean;
  } = {}
): string {
  const {
    showDecimals = false,
    showSymbol = true,
    showCode = false,
  } = options;
  
  const currencyConfig = CURRENCIES[currency] || CURRENCIES.KZT;
  const decimals = showDecimals ? currencyConfig.decimals : 0;
  
  // Format number with commas
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  // Build currency string
  let result = formattedAmount;
  
  if (showSymbol) {
    if (currencyConfig.position === 'before') {
      result = `${currencyConfig.symbol}${result}`;
    } else {
      result = `${result} ${currencyConfig.symbol}`;
    }
  }
  
  if (showCode) {
    result = `${result} ${currencyConfig.code}`;
  }
  
  return result;
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency: string = 'KZT'
): string {
  const min = formatCurrency(minPrice, currency);
  const max = formatCurrency(maxPrice, currency);
  return `${min} - ${max}`;
}

/**
 * Format savings amount
 */
export function formatSavings(
  amount: number,
  currency: string = 'KZT',
  showSign: boolean = true
): string {
  const formatted = formatCurrency(Math.abs(amount), currency);
  
  if (showSign && amount > 0) {
    return `-${formatted}`;
  }
  
  return formatted;
}

/**
 * Format savings percentage
 */
export function formatSavingsPercentage(percentage: number): string {
  if (percentage === 0) return '0%';
  return `${Math.round(percentage)}%`;
}

/**
 * Format price change
 */
export function formatPriceChange(
  oldPrice: number,
  newPrice: number,
  currency: string = 'KZT'
): {
  amount: string;
  percentage: string;
  direction: 'up' | 'down' | 'same';
} {
  const difference = newPrice - oldPrice;
  const percentageChange = oldPrice > 0 ? (difference / oldPrice) * 100 : 0;
  
  return {
    amount: formatSavings(Math.abs(difference), currency, false),
    percentage: formatSavingsPercentage(Math.abs(percentageChange)),
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same',
  };
}

/**
 * Format per-person label
 */
export function formatPerPersonLabel(price: number, currency: string = 'KZT'): string {
  return `${formatCurrency(price, currency)}/person`;
}

/**
 * Format total trip price
 */
export function formatTotalTripPrice(
  pricePerPerson: number,
  passengers: number,
  currency: string = 'KZT'
): string {
  const total = pricePerPerson * passengers;
  return formatCurrency(total, currency);
}

/**
 * Format price with discount badge
 */
export function formatPriceWithDiscount(
  currentPrice: number,
  originalPrice: number,
  currency: string = 'KZT'
): {
  current: string;
  original: string;
  discount: string;
  hasDiscount: boolean;
} {
  const hasDiscount = currentPrice < originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;
  
  return {
    current: formatCurrency(currentPrice, currency),
    original: formatCurrency(originalPrice, currency),
    discount: `${discountPercentage}% OFF`,
    hasDiscount,
  };
}

/**
 * Format breakdown item
 */
export function formatBreakdownItem(
  label: string,
  amount: number,
  currency: string = 'KZT'
): {
  label: string;
  amount: string;
  rawAmount: number;
} {
  return {
    label,
    amount: formatCurrency(amount, currency),
    rawAmount: amount,
  };
}

/**
 * Get price display color based on value
 */
export function getPriceColor(
  price: number,
  threshold: {
    low: number;
    medium: number;
    high: number;
  }
): string {
  if (price <= threshold.low) {
    return 'text-emerald-600'; // Great price
  } else if (price <= threshold.medium) {
    return 'text-blue-600'; // Good price
  } else if (price <= threshold.high) {
    return 'text-amber-600'; // Fair price
  } else {
    return 'text-gray-600'; // Standard price
  }
}

/**
 * Format currency for input display
 */
export function formatCurrencyInput(value: string, currency: string = 'KZT'): string {
  // Remove non-numeric characters
  const numeric = value.replace(/[^\d]/g, '');
  
  if (!numeric) return '';
  
  const number = parseInt(numeric, 10);
  return formatCurrency(number, currency, { showDecimals: false });
}

/**
 * Parse currency input to number
 */
export function parseCurrencyInput(value: string): number {
  const numeric = value.replace(/[^\d]/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
}

/**
 * Format compact price (K, M notation)
 */
export function formatCompactPrice(amount: number, currency: string = 'KZT'): string {
  const currencyConfig = CURRENCIES[currency] || CURRENCIES.KZT;
  
  let formatted: string;
  if (amount >= 1000000) {
    formatted = `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    formatted = `${(amount / 1000).toFixed(1)}K`;
  } else {
    formatted = amount.toString();
  }
  
  if (currencyConfig.position === 'before') {
    return `${currencyConfig.symbol}${formatted}`;
  } else {
    return `${formatted}${currencyConfig.symbol}`;
  }
}

/**
 * Format price tooltip
 */
export function formatPriceTooltip(
  breakdown: {
    base: number;
    fees: number;
    discount: number;
    total: number;
  },
  currency: string = 'KZT'
): string {
  const lines = [
    `Base: ${formatCurrency(breakdown.base, currency)}`,
    `Fees: ${formatCurrency(breakdown.fees, currency)}`,
  ];
  
  if (breakdown.discount > 0) {
    lines.push(`Discount: -${formatCurrency(breakdown.discount, currency)}`);
  }
  
  lines.push(`Total: ${formatCurrency(breakdown.total, currency)}`);
  
  return lines.join('\n');
}
