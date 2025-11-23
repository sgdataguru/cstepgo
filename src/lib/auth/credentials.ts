import { format } from 'date-fns';
import bcrypt from 'bcrypt';

export interface DriverCredentials {
  driverId: string;      // DRV-20251106-AB123
  tempPassword: string;  // 8 chars
  loginUrl: string;      // https://steppergo.com/driver/login
}

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

/**
 * Generate secure random password
 */
function generatePassword(options: PasswordOptions): string {
  // Exclude confusing characters
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Exclude l
  const numbers = '23456789'; // Exclude 0, 1
  const symbols = '!@#$%^&*';
  
  let charset = '';
  let password = '';
  
  if (options.uppercase) charset += uppercase;
  if (options.lowercase) charset += lowercase;
  if (options.numbers) charset += numbers;
  if (options.symbols) charset += symbols;
  
  // Ensure at least one of each required type
  if (options.uppercase) password += uppercase[Math.floor(Math.random() * uppercase.length)];
  if (options.lowercase) password += lowercase[Math.floor(Math.random() * lowercase.length)];
  if (options.numbers) password += numbers[Math.floor(Math.random() * numbers.length)];
  if (options.symbols) password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining length
  for (let i = password.length; i < options.length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate random alphanumeric string
 */
function randomAlphanumeric(length: number, options: { uppercase?: boolean } = {}): string {
  const chars = options.uppercase 
    ? 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    : 'abcdefghijkmnopqrstuvwxyz23456789';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate driver credentials with unique ID and temporary password
 */
export function generateDriverCredentials(): DriverCredentials {
  const today = format(new Date(), 'yyyyMMdd');
  const randomSuffix = randomAlphanumeric(5, { uppercase: true });
  const driverId = `DRV-${today}-${randomSuffix}`;
  
  // Generate secure password: 8 chars, mix of upper/lower/numbers, no symbols for easy SMS
  const tempPassword = generatePassword({
    length: 8,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/driver/login`;
  
  return {
    driverId,
    tempPassword,
    loginUrl,
  };
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
