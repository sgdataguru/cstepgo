# Driver Trip Acceptance Security Fix

## Overview
This document describes the security vulnerability that was discovered and fixed in the driver trip acceptance endpoint.

## Security Vulnerability

### Issue
The driver trip acceptance endpoint (`/api/drivers/trips/accept/[tripId]`) and related driver endpoints were vulnerable to trip hijacking attacks due to:

1. **Insecure Authentication**: Endpoints relied solely on the `x-driver-id` HTTP header without proper token validation
2. **No Session Verification**: No validation of driver identity based on session tokens or JWT
3. **Missing Ownership Checks**: No verification that a driver owns/is assigned to a trip before allowing actions
4. **Header Spoofing**: Attackers could craft `x-driver-id` headers to impersonate other drivers

### Impact
- **Critical Severity**: Attackers could hijack trips by impersonating legitimate drivers
- **Data Breach**: Unauthorized access to trip details, passenger information
- **Financial Loss**: Fraudulent trip acceptances and earnings manipulation
- **Reputation Damage**: Loss of trust in the platform's security

## Security Fix

### Changes Implemented

#### 1. Secure Authentication Helper (`src/lib/auth/driverAuth.ts`)

Created a new authentication module with the following functions:

```typescript
// Authenticate driver from JWT token or session
export async function authenticateDriver(request: NextRequest)

// Verify driver owns a specific trip
export async function verifyDriverOwnsTrip(driverId: string, tripId: string)

// Verify trip is available for acceptance
export async function verifyTripAvailableForAcceptance(tripId: string)
```

**Authentication Flow**:
1. Extract token from `Authorization` header or `driver_session` cookie
2. Validate JWT token or verify session token in database
3. Confirm user role is `DRIVER`
4. Fetch driver profile and verify status (not rejected/suspended)
5. Return authenticated driver object

#### 2. Updated Endpoints

**Primary Endpoint** (`src/app/api/drivers/trips/accept/[tripId]/route.ts`):
- ✅ POST: Accept a trip (now uses `authenticateDriver` + `verifyTripAvailableForAcceptance`)
- ✅ DELETE: Cancel trip acceptance (now uses `authenticateDriver` + ownership verification)
- ✅ GET: Get trip details (now uses `authenticateDriver`)

**Related Endpoints Updated**:
- `/api/drivers/trips/[tripId]/status` - Trip status updates with ownership verification
- `/api/drivers/trips/acceptance/enhanced` - Enhanced acceptance with secure auth
- `/api/drivers/trips/acceptance/offer` - Trip offer handling with secure auth
- `/api/drivers/trips/available` - Available trips listing with secure auth

#### 3. Removed Insecure Code

**Before** (Vulnerable):
```typescript
async function getDriverFromRequest(request: NextRequest) {
  const driverId = request.headers.get('x-driver-id');  // ❌ Trusts crafted header
  
  if (!driverId) {
    throw new Error('Driver not authenticated');
  }
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },  // ❌ No token validation
    include: { user: true }
  });
  
  return driver;
}
```

**After** (Secure):
```typescript
import { authenticateDriver, verifyTripAvailableForAcceptance } from '@/lib/auth/driverAuth';

// In endpoint handler:
const driver = await authenticateDriver(request);  // ✅ Validates JWT/session
await verifyTripAvailableForAcceptance(tripId);    // ✅ Validates trip state
```

### Security Validation Script

Created comprehensive test script (`scripts/validate-driver-trip-security.ts`) to verify:

1. ✅ Reject requests without authentication
2. ✅ Reject requests with crafted `x-driver-id` header only
3. ✅ Reject requests with expired tokens
4. ✅ Accept requests with valid authentication
5. ✅ Prevent trip hijacking (different driver attempting to accept)
6. ✅ Ignore crafted headers when valid token present

## Testing

### Running Security Validation

```bash
# Run the security validation script
npx tsx scripts/validate-driver-trip-security.ts
```

Expected output: All tests should pass ✅

### Manual Testing

1. **Valid Authentication**:
   ```bash
   curl -X POST http://localhost:3000/api/drivers/trips/accept/TRIP_ID \
     -H "Authorization: Bearer VALID_TOKEN" \
     -H "Content-Type: application/json"
   ```
   Expected: 200 OK (if trip is available)

2. **No Authentication**:
   ```bash
   curl -X POST http://localhost:3000/api/drivers/trips/accept/TRIP_ID \
     -H "Content-Type: application/json"
   ```
   Expected: 401 Unauthorized

3. **Crafted Header Only**:
   ```bash
   curl -X POST http://localhost:3000/api/drivers/trips/accept/TRIP_ID \
     -H "x-driver-id: CRAFTED_DRIVER_ID" \
     -H "Content-Type: application/json"
   ```
   Expected: 401 Unauthorized (header is ignored)

4. **Trip Hijack Attempt**:
   ```bash
   # Attacker tries to accept trip assigned to another driver
   curl -X POST http://localhost:3000/api/drivers/trips/accept/TRIP_ID \
     -H "Authorization: Bearer ATTACKER_TOKEN" \
     -H "Content-Type: application/json"
   ```
   Expected: 400 Bad Request ("Trip has already been accepted")

## Migration Guide

### For Frontend/Mobile Apps

**Update API Calls**:

**Before**:
```typescript
// ❌ Old insecure approach
fetch('/api/drivers/trips/accept/TRIP_ID', {
  method: 'POST',
  headers: {
    'x-driver-id': driverId,  // Don't use this anymore
  }
});
```

**After**:
```typescript
// ✅ New secure approach
const token = localStorage.getItem('driver_session');  // or access_token

fetch('/api/drivers/trips/accept/TRIP_ID', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // Use JWT or session token
  }
});

// Or let cookies handle it automatically (if using httpOnly cookies)
fetch('/api/drivers/trips/accept/TRIP_ID', {
  method: 'POST',
  credentials: 'include',  // Sends httpOnly cookies
});
```

### For Other Backend Services

If any internal services call driver endpoints, update them to:
1. Use proper JWT tokens or session tokens
2. Remove any `x-driver-id` header usage
3. Implement token refresh logic for expired tokens

## Security Best Practices

### Authentication Tokens

1. **Storage**: Use httpOnly cookies for session tokens (prevents XSS)
2. **Transmission**: Always use HTTPS in production
3. **Expiration**: JWT access tokens expire in 15 minutes, refresh tokens in 30 days
4. **Rotation**: Implement token refresh mechanism

### Session Management

1. **Database Validation**: All sessions are validated against the database
2. **Expiration**: Sessions automatically expire after configured time
3. **Revocation**: Sessions can be revoked (logout, security breach)
4. **Tracking**: Session IDs are unique and tracked for audit logs

### API Security

1. **No Trust in Headers**: Never trust custom headers for authentication
2. **Token Validation**: Always validate JWT signature and claims
3. **Role Verification**: Confirm user role matches endpoint requirements
4. **Ownership Checks**: Verify user owns/can access the resource
5. **Rate Limiting**: Implement rate limiting on sensitive endpoints

## Rollout Plan

### Phase 1: Backend Deployment ✅
- [x] Deploy secure authentication functions
- [x] Update all driver trip endpoints
- [x] Deploy security validation script
- [x] Monitor error logs for authentication failures

### Phase 2: Frontend Updates
- [ ] Update driver mobile app to use Authorization header
- [ ] Update driver web portal to use Authorization header
- [ ] Remove all `x-driver-id` header usage
- [ ] Test authentication flows end-to-end

### Phase 3: Deprecation
- [ ] Log warnings for any remaining `x-driver-id` usage
- [ ] After grace period, completely remove header support
- [ ] Update API documentation

## Monitoring

### Security Metrics to Track

1. **Authentication Failures**: Monitor 401 errors by endpoint
2. **Failed Trip Hijack Attempts**: Log attempts with mismatched driver IDs
3. **Token Expiration Rate**: Track how often tokens expire during sessions
4. **Session Validation Failures**: Monitor invalid/expired sessions

### Alerts to Configure

- Spike in 401 errors (potential attack or integration issue)
- Multiple failed trip acceptance attempts from same driver
- Unusual pattern of driver switching between devices/IPs
- Database session validation failures

## Documentation Updates

### API Documentation
- ✅ Updated authentication requirements
- ✅ Removed `x-driver-id` from examples
- ✅ Added `Authorization` header examples
- ✅ Documented error codes and responses

### Developer Guide
- ✅ Security best practices documented
- ✅ Authentication flow diagrams
- ✅ Token management guide
- ✅ Testing procedures

## Lessons Learned

1. **Never Trust Client Headers**: Custom headers can be easily spoofed
2. **Defense in Depth**: Multiple layers of validation (token + session + ownership)
3. **Test Security Early**: Security validation should be part of CI/CD
4. **Clear Documentation**: Security requirements must be clear to all developers
5. **Audit Regularly**: Regular security audits catch issues before they're exploited

## References

- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## Contact

For security concerns or questions:
- Security Team: security@steppergo.com
- Development Lead: dev@steppergo.com
- Emergency: security-urgent@steppergo.com
