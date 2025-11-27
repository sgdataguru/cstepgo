# Security & Validation Enhancements

This document describes the comprehensive security and validation features implemented for the StepperGO platform.

## Table of Contents

1. [JWT Authentication](#jwt-authentication)
2. [Admin Approval Workflow](#admin-approval-workflow)
3. [File Upload Security](#file-upload-security)
4. [SMS/WhatsApp OTP](#smswhatsapp-otp)
5. [Document Verification](#document-verification)
6. [Configuration](#configuration)
7. [API Reference](#api-reference)

---

## JWT Authentication

### Overview

The platform uses JWT (JSON Web Tokens) for secure authentication with the following features:

- **Short-lived access tokens** (15 minutes by default)
- **Refresh tokens** for session renewal (30 days)
- **Token rotation** on refresh
- **Payload encryption** for sensitive data
- **Standard JWT claims** (iss, aud, sub, jti)

### Token Structure

**Access Token Payload:**
```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "DRIVER|PASSENGER|ADMIN",
  "sessionId": "session_id",
  "jti": "token_id",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "https://steppergo.com",
  "aud": "steppergo-api"
}
```

**Refresh Token Payload:**
```json
{
  "userId": "user_id",
  "sessionId": "session_id",
  "type": "refresh",
  "jti": "token_id",
  "iat": 1234567890,
  "exp": 1237246890
}
```

### Usage in API Routes

```typescript
import { withAuth, withAdmin, withDriver } from '@/lib/auth/middleware';

// Authenticated route (any logged-in user)
export const GET = withAuth(async (req, user) => {
  const userId = user.userId;
  // ... handle request
});

// Admin-only route
export const POST = withAdmin(async (req, user) => {
  // Only admins can access this
  // ... handle request
});

// Driver-only route
export const PUT = withDriver(async (req, user) => {
  // Only drivers can access this
  // ... handle request
});
```

### Token Refresh Flow

1. Client sends refresh token to `/api/auth/refresh`
2. Server validates refresh token
3. Server checks session still exists and is valid
4. Server generates new token pair
5. Old refresh token is invalidated
6. New tokens returned to client

---

## Admin Approval Workflow

### Overview

Critical actions require admin approval before becoming active:

- Driver registrations
- Document submissions
- Trip postings (optional)
- Account modifications (optional)

### Approval States

- `PENDING_REVIEW` - Awaiting admin action
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin

### Database Schema

```sql
-- Driver approval fields
approval_status TEXT DEFAULT 'PENDING_REVIEW'
approved_by TEXT
approved_at_admin TIMESTAMP
rejection_reason_admin TEXT
admin_notes TEXT
```

### API Endpoints

#### List Pending Approvals

```
GET /api/admin/approvals?type=drivers&status=PENDING_REVIEW&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "drivers": {
      "items": [...],
      "total": 50,
      "page": 1,
      "limit": 20,
      "hasMore": true
    }
  }
}
```

#### Approve/Reject Driver

```
POST /api/admin/approvals/driver
```

**Request:**
```json
{
  "driverId": "driver_id",
  "action": "approve|reject",
  "notes": "Optional admin notes",
  "rejectionReason": "Reason for rejection (if rejecting)"
}
```

### Audit Logging

All admin actions are logged in the `AdminAction` table:

```typescript
{
  adminId: "admin_user_id",
  actionType: "APPROVE_DRIVER|REJECT_DRIVER",
  targetType: "DRIVER",
  targetId: "target_id",
  details: { /* action-specific details */ },
  ipAddress: "1.2.3.4",
  userAgent: "Mozilla/5.0...",
  createdAt: "2024-01-01T00:00:00Z"
}
```

---

## File Upload Security

### Overview

Secure file upload handling with:

- MIME type validation
- File size limits
- Secure filename generation
- Path traversal prevention
- AWS S3 storage with encryption

### Validation Rules

**Allowed MIME Types:**
- Images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Documents: `application/pdf`, `image/jpeg`, `image/png`

**Size Limits:**
- Profile images: 5MB
- Documents: 10MB
- Vehicle photos: 5MB

### Upload Endpoint

```
POST /api/upload
Content-Type: multipart/form-data

Fields:
- file: File (required)
- purpose: string (profileImage|document|vehiclePhoto)
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_id",
    "url": "https://cdn.steppergo.com/...",
    "name": "original_filename.jpg",
    "size": 1024567,
    "type": "image/jpeg",
    "purpose": "profileImage",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

### S3 Configuration

Files are stored in AWS S3 with:
- Server-side encryption (AES256)
- Unique, randomized paths
- Private bucket access
- Optional CDN distribution

### Security Features

1. **Filename Sanitization**: Removes path traversal patterns
2. **Secure Storage Path**: `purpose/userId/timestamp-random.ext`
3. **Metadata Tracking**: All uploads logged in database
4. **Access Control**: Signed URLs for private files

---

## SMS/WhatsApp OTP

### Overview

One-Time Password (OTP) delivery via SMS and WhatsApp for:

- Phone number verification
- Driver credential delivery
- Two-factor authentication
- Password reset

### OTP Configuration

- **Length**: 6 digits
- **Expiration**: 10 minutes
- **Max Attempts**: 3 verification attempts
- **Rate Limiting**: 3 OTP requests per minute per phone

### Send OTP

```
POST /api/otp/send
```

**Request:**
```json
{
  "phone": "+1234567890",
  "channel": "SMS|WHATSAPP"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully via SMS",
  "expiresAt": "2024-01-01T00:10:00Z"
}
```

### Verify OTP

```
POST /api/otp/verify
```

**Request:**
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### Error Responses

- `RATE_LIMITED`: Too many requests
- `TOO_SOON`: OTP recently sent
- `NOT_FOUND`: No valid OTP found
- `MAX_ATTEMPTS`: Too many failed attempts
- `INVALID_CODE`: Incorrect OTP

### Database Storage

OTPs are stored hashed using bcrypt:

```sql
CREATE TABLE OTP (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  verified_at TIMESTAMP
)
```

---

## Document Verification

### Overview

Automated workflow for document submission and verification:

- Driver license
- Vehicle registration
- Insurance documents
- Identity documents

### Document Types

- `LICENSE` - Driver's license
- `INSURANCE` - Vehicle insurance
- `REGISTRATION` - Vehicle registration
- `ID_CARD` - National ID card
- `PASSPORT` - Passport
- `VEHICLE_PHOTO` - Vehicle photos

### Document Submission

```
POST /api/documents/verify
```

**Request:**
```json
{
  "documentType": "LICENSE",
  "documentNumber": "DL123456",
  "documentUrl": "https://s3.amazonaws.com/...",
  "expiryDate": "2025-12-31T00:00:00Z",
  "driverId": "driver_id"
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_id",
    "documentType": "LICENSE",
    "status": "PENDING",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Admin Document Verification

```
POST /api/admin/documents
```

**Request:**
```json
{
  "documentId": "doc_id",
  "action": "verify|reject",
  "rejectionReason": "Reason if rejecting"
}
```

### Document Status Flow

```
PENDING → VERIFIED
       ↘ REJECTED
```

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ENCRYPTION_KEY=your-encryption-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Business API
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
NEXT_PUBLIC_WHATSAPP_ENABLED=true

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=steppergo-documents
AWS_REGION=us-east-1
NEXT_PUBLIC_S3_CDN_URL=https://cdn.steppergo.com

# Application
NEXT_PUBLIC_APP_URL=https://steppergo.com
```

### Security Best Practices

1. **Secrets Management**:
   - Never commit secrets to version control
   - Use strong, randomly generated keys (min 32 characters)
   - Rotate keys periodically
   - Use separate keys for development and production

2. **Token Security**:
   - Keep access tokens short-lived (15-30 minutes)
   - Store refresh tokens securely
   - Implement token revocation for logout
   - Use HTTPS in production

3. **File Upload**:
   - Validate file types on server-side
   - Scan files for malware
   - Use separate storage bucket
   - Implement file size limits

4. **OTP Security**:
   - Hash OTPs before storage
   - Implement rate limiting
   - Use secure random number generation
   - Clear expired OTPs regularly

---

## API Reference

### Admin Middleware

The admin middleware (`src/lib/auth/adminMiddleware.ts`) provides secure role-based access control for admin routes.

#### `requireAdmin(request: NextRequest): Promise<NextResponse | null>`

Validates that the request comes from an authenticated user with the ADMIN role.

**Authentication Flow:**
1. Extracts JWT token from `Authorization` header (Bearer token) or `access_token` cookie
2. Verifies the JWT token using `verifyAccessToken()`
3. Checks that the user's role is `ADMIN`
4. Optionally validates the session against the database for token revocation support
5. Returns `null` if authorized (request proceeds), or an error response if unauthorized

**Error Responses:**
- `401 Unauthorized` - No token provided, invalid token, expired token, or session expired
- `403 Forbidden` - User authenticated but does not have ADMIN role
- `500 Internal Server Error` - Server-side error during validation

**Usage Example:**
```typescript
import { requireAdmin } from '@/lib/auth/adminMiddleware';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;  // Returns error response if not authorized
  
  // Proceed with admin-only logic
  // ...
}
```

**Security Note:** The `requireAdmin` function enforces proper JWT authentication and ADMIN role validation in all environments (development, staging, production). There is no bypass mechanism.

### Alternative: withAdmin Wrapper

For a more concise syntax, use the `withAdmin` wrapper from `@/lib/auth/middleware`:

```typescript
import { withAdmin } from '@/lib/auth/middleware';

async function handlePost(req: NextRequest, user: TokenPayload) {
  // User is guaranteed to be an admin here
  const adminId = user.userId;
  // ...
}

export const POST = withAdmin(handlePost);
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/refresh` | No | Refresh access token |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/approvals` | Admin | List pending approvals |
| POST | `/api/admin/approvals/driver` | Admin | Approve/reject driver |
| GET | `/api/admin/documents` | Admin | List pending documents |
| POST | `/api/admin/documents` | Admin | Verify/reject document |

### File Upload Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | Yes | Upload file |
| GET | `/api/upload` | No | Get endpoint info |

### Document Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/documents/verify` | Yes | Submit document |
| GET | `/api/documents/verify` | Yes | Get user documents |

### OTP Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/otp/send` | No | Send OTP |
| POST | `/api/otp/verify` | No | Verify OTP |

---

## Testing

### Manual Testing

#### 1. JWT Authentication

```bash
# Get access token (via login)
curl -X POST http://localhost:3000/api/drivers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@example.com","password":"password"}'

# Use access token
curl http://localhost:3000/api/protected-route \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

#### 2. File Upload

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.jpg" \
  -F "purpose=profileImage"
```

#### 3. OTP Flow

```bash
# Send OTP
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","channel":"SMS"}'

# Verify OTP
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","code":"123456"}'
```

---

## Monitoring & Maintenance

### Audit Logs

Check admin actions:
```sql
SELECT * FROM "AdminAction"
WHERE action_type = 'APPROVE_DRIVER'
ORDER BY created_at DESC;
```

### OTP Cleanup

Run periodically to clean expired OTPs:
```typescript
import { cleanupExpiredOTPs } from '@/lib/services/otpService';

// Clean up expired OTPs
const deleted = await cleanupExpiredOTPs();
console.log(`Deleted ${deleted} expired OTPs`);
```

### File Storage Monitoring

Monitor S3 bucket usage and costs:
- Track upload frequency
- Monitor storage growth
- Set up alerts for unusual activity
- Implement lifecycle policies

---

## Troubleshooting

### Common Issues

1. **JWT_SECRET not configured**
   - Error: "JWT_SECRET must be configured in environment variables"
   - Solution: Add JWT_SECRET to .env file

2. **S3 upload fails**
   - Error: "File upload service is not configured"
   - Solution: Configure AWS credentials in .env

3. **OTP not sending**
   - Error: "Twilio is not configured"
   - Solution: Add Twilio credentials to .env

4. **Token expired**
   - Error: "Token has expired"
   - Solution: Use refresh token to get new access token

---

## Security Considerations

### Potential Threats

1. **Token Theft**: Mitigated by short token expiration and secure storage
2. **Brute Force OTP**: Mitigated by rate limiting and max attempts
3. **File Upload Exploits**: Mitigated by validation and sandboxed storage
4. **Admin Impersonation**: Mitigated by JWT verification and audit logging

### Future Enhancements

- [ ] Implement IP-based rate limiting
- [ ] Add device fingerprinting
- [ ] Implement anomaly detection
- [ ] Add CAPTCHA for sensitive operations
- [ ] Implement backup authentication methods
- [ ] Add webhook notifications for admin actions

---

## Support

For issues or questions:
- Create an issue in the repository
- Contact: support@steppergo.com
- Documentation: https://docs.steppergo.com
