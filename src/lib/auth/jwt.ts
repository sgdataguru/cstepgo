import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// JWT Configuration - MUST be set in environment
// Use non-null assertions because we validate below
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)!;
const JWT_ISSUER = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWT_AUDIENCE = 'steppergo-api';

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // 30 days

// Encryption key for sensitive payload data - MUST be separate from JWT secrets
const ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY!;

// Validate required environment variables
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not configured. Application cannot start without it.');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('CRITICAL: JWT_REFRESH_SECRET environment variable is not configured. Application cannot start without it.');
}

if (!ENCRYPTION_KEY) {
  throw new Error('CRITICAL: JWT_ENCRYPTION_KEY environment variable is not configured. Application cannot start without it.');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  [key: string]: any;
}

export interface TokenOptions {
  expiresIn?: string;
  audience?: string;
  issuer?: string;
  subject?: string;
}

export interface VerifyOptions {
  audience?: string;
  issuer?: string;
  subject?: string;
}

/**
 * Encrypt sensitive data in token payload
 */
function encryptPayloadData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Payload encryption error:', error);
    throw new Error('Failed to encrypt payload data');
  }
}

/**
 * Decrypt sensitive data from token payload
 */
function decryptPayloadData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Payload decryption error:', error);
    throw new Error('Failed to decrypt payload data');
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign an access token with enhanced security
 */
export function signAccessToken(
  payload: TokenPayload,
  options: TokenOptions = {}
): string {
  // Environment validation is done at module load time
  // Generate unique token ID (jti) for tracking
  const tokenId = crypto.randomBytes(16).toString('hex');

  // Create token payload with standard claims
  const tokenPayload = {
    ...payload,
    jti: tokenId,
    iat: Math.floor(Date.now() / 1000),
  };

  // Sign the token
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: options.expiresIn || ACCESS_TOKEN_EXPIRES_IN,
    audience: options.audience || JWT_AUDIENCE,
    issuer: options.issuer || JWT_ISSUER,
    subject: options.subject || payload.userId,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Sign a refresh token
 */
export function signRefreshToken(
  payload: TokenPayload,
  options: TokenOptions = {}
): string {
  // Environment validation is done at module load time
  // Generate unique token ID (jti) for tracking
  const tokenId = crypto.randomBytes(16).toString('hex');

  // Minimal payload for refresh tokens
  const tokenPayload = {
    userId: payload.userId,
    sessionId: payload.sessionId || generateSessionId(),
    type: 'refresh',
    jti: tokenId,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: options.expiresIn || REFRESH_TOKEN_EXPIRES_IN,
    audience: options.audience || JWT_AUDIENCE,
    issuer: options.issuer || JWT_ISSUER,
    subject: options.subject || payload.userId,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(
  token: string,
  options: VerifyOptions = {}
): TokenPayload {
  // Environment validation is done at module load time
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      algorithms: ['HS256'],
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not yet valid');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(
  token: string,
  options: VerifyOptions = {}
): TokenPayload {
  // Environment validation is done at module load time
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      algorithms: ['HS256'],
    }) as TokenPayload;

    // Verify it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Decode token without verification (useful for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Create a token pair (access + refresh)
 */
export function createTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const sessionId = generateSessionId();
  const payloadWithSession = { ...payload, sessionId };

  const accessToken = signAccessToken(payloadWithSession);
  const refreshToken = signRefreshToken(payloadWithSession);

  // Calculate expiration in seconds
  const expiresIn = parseExpiration(ACCESS_TOKEN_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  
  const units: { [key: string]: number } = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default to 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * (units[unit] || 1);
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Encrypt sensitive fields in payload before signing
 */
export function encryptSensitivePayload(payload: TokenPayload, sensitiveFields: string[]): TokenPayload {
  const encrypted = { ...payload };
  
  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = encryptPayloadData(JSON.stringify(encrypted[field]));
    }
  }
  
  return encrypted;
}

/**
 * Decrypt sensitive fields from verified payload
 */
export function decryptSensitivePayload(payload: TokenPayload, sensitiveFields: string[]): TokenPayload {
  const decrypted = { ...payload };
  
  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      try {
        const decryptedValue = decryptPayloadData(decrypted[field] as string);
        decrypted[field] = JSON.parse(decryptedValue);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return decrypted;
}
