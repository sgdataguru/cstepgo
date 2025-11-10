import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

/**
 * Generate a unique driver ID in format: DRV-YYYYMMDD-XXXXX
 * @returns Driver ID string
 */
export function generateDriverId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomId = nanoid(5).toUpperCase();
  
  return `DRV-${year}${month}${day}-${randomId}`;
}

/**
 * Generate a secure temporary password
 * @param length Password length (default: 12)
 * @returns Generated password
 */
export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate driver credentials including ID, temporary password and hash
 * @returns Object containing driverId, password, and passwordHash
 */
export async function generateDriverCredentials(): Promise<{
  driverId: string;
  password: string;
  passwordHash: string;
  expiresAt: Date;
}> {
  const driverId = generateDriverId();
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  
  // Password expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return {
    driverId,
    password,
    passwordHash,
    expiresAt,
  };
}

/**
 * Compare a plain text password with a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
