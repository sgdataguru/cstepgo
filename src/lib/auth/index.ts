/**
 * Auth module exports
 * Re-exports authentication functions and types
 */

export {
  authenticateRequest,
  verifyRole,
  getAuthenticatedUser,
  withAuth,
  withRole,
  withAdmin,
  withDriver,
  getUserFromRequest,
  type TokenPayload,
  type AuthenticatedRequest,
} from './middleware';

export {
  createTokenPair,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  decodeToken,
  encryptSensitivePayload,
  decryptSensitivePayload,
  generateSessionId,
} from './jwt';

// Alias for backward compatibility
export { authenticateRequest as verifyAuth } from './middleware';
