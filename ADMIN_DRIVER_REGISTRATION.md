# Admin Manual Driver Registration Portal

This feature allows administrators to manually register drivers on their behalf, enabling quick driver onboarding without requiring self-registration.

## Features

### 1. Driver Registration
- Multi-step registration form with validation
- Personal information (name, email, phone, license)
- Vehicle information (make, model, year, plates)
- Document upload with S3 integration
- Auto-approval option
- Automatic credential generation

### 2. Document Management
- Secure S3 upload with pre-signed URLs
- Support for JPEG, PNG, WebP, and PDF files
- Real-time upload progress tracking
- Encryption at rest (AES256)
- Document types:
  - Driver's License (required)
  - Vehicle Registration (required)
  - Vehicle Insurance (required)
  - Vehicle Photo (optional)
  - Profile Photo (optional)

### 3. Credential Delivery
- Multi-channel delivery system with fallback:
  - **Primary**: WhatsApp message
  - **Fallback**: SMS if WhatsApp fails
  - **Optional**: Email if provided
- Delivery tracking and logging
- Success rate monitoring

### 4. Driver Management
- List all drivers with search and filters
- Status-based filtering (Pending, Approved, Rejected, Suspended)
- Pagination support
- Send reminder for drivers who haven't logged in
- View detailed driver information

### 5. Security Features
- Admin-only access with middleware
- Temporary passwords that expire in 30 days
- Force password change on first login
- Comprehensive audit logging
- All admin actions tracked with IP and user agent

## API Endpoints

### Driver Registration
```
POST /api/admin/drivers
```
Register a new driver with all required information.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+7 777 123 4567",
  "vehicleType": "sedan",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  "vehicleYear": 2020,
  "vehicleColor": "White",
  "licensePlate": "ABC 123",
  "licenseNumber": "AB1234567",
  "licenseExpiry": "2025-12-31T00:00:00Z",
  "documents": {
    "driverLicense": "drivers/DRV-20241110-XXXXX/driver_license/...",
    "vehicleRegistration": "drivers/DRV-20241110-XXXXX/vehicle_registration/...",
    "vehicleInsurance": "drivers/DRV-20241110-XXXXX/vehicle_insurance/..."
  },
  "autoApprove": false,
  "sendCredentials": true
}
```

### List Drivers
```
GET /api/admin/drivers?status=PENDING&search=john&page=1&limit=20
```

### Update Driver
```
PATCH /api/admin/drivers/[id]
```

### Get Driver Details
```
GET /api/admin/drivers/[id]
```

### Send Reminder
```
POST /api/admin/drivers/send-reminder
```
**Request Body:**
```json
{
  "driverId": "clxxxxxx"
}
```

### Generate Upload URL
```
POST /api/admin/upload-url
```
**Request Body:**
```json
{
  "driverId": "DRV-20241110-XXXXX",
  "fileType": "driver_license",
  "fileName": "license.jpg",
  "contentType": "image/jpeg"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# AWS S3 for Document Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=steppergo-documents
AWS_REGION=us-east-1
NEXT_PUBLIC_S3_CDN_URL=https://cdn.steppergo.com

# Twilio for WhatsApp & SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Resend for Email
RESEND_API_KEY=your_resend_api_key
POSTMARK_FROM_EMAIL=noreply@steppergo.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/steppergo
```

## Database Setup

1. Generate Prisma client:
```bash
npm run db:generate
```

2. Create migration:
```bash
npx prisma migrate dev --name add_admin_driver_registration
```

3. Apply migration:
```bash
npm run db:migrate
```

4. Create an admin user (via Prisma Studio or seed script):
```bash
npm run db:studio
```

Create a user with `role: "ADMIN"` to access the admin portal.

## Usage

### Access the Admin Portal
Navigate to: `http://localhost:3000/admin/drivers`

### Register a Driver

1. Click "Register New Driver" tab
2. Fill in personal information (Step 1)
3. Fill in vehicle information (Step 2)
4. Upload required documents (Step 3)
5. Choose registration options:
   - Auto-approve driver (skip manual review)
   - Send credentials (via WhatsApp/SMS/Email)
6. Click "Register Driver"

### Manage Drivers

1. Click "Driver List" tab
2. Search by name, email, phone, or driver ID
3. Filter by status (Pending, Approved, Rejected, Suspended)
4. Send reminders to drivers who haven't logged in
5. View driver details

## Driver ID Format

Driver IDs are automatically generated in the format:
```
DRV-YYYYMMDD-XXXXX
```

Example: `DRV-20241110-A1B2C`

- `DRV`: Prefix for driver
- `YYYYMMDD`: Registration date
- `XXXXX`: Random 5-character alphanumeric string

## Credential Security

### Temporary Passwords
- Generated with high entropy (12 characters)
- Contains uppercase, lowercase, numbers, and symbols
- Expires in 30 days
- Must be changed on first login

### Password Storage
- Hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Secure comparison during authentication

### Credential Delivery
- Sent via encrypted channels (WhatsApp, SMS, Email)
- Delivery status tracked in database
- Failed deliveries logged for retry

## Audit Logging

All admin actions are logged with:
- Admin user ID
- Action type (driver_registered, credentials_sent, etc.)
- Target entity type and ID
- Action details (JSON)
- IP address
- User agent
- Timestamp

### View Audit Logs
Query the `AdminActionLog` table in the database to view all admin actions.

## Success Criteria

- ✅ <5 minutes to register a driver (admin side)
- ✅ >90% drivers log in within 48 hours
- ✅ >95% credential delivery success rate
- ✅ Onboard 100 drivers within 2 weeks

## Testing

### Test Credential Generation
```typescript
import { generateDriverCredentials } from '@/lib/admin/credentials';

const credentials = await generateDriverCredentials();
console.log(credentials);
// {
//   driverId: 'DRV-20241110-A1B2C',
//   password: 'aB3$cD5fG7hJ',
//   passwordHash: '$2b$10$...',
//   expiresAt: Date
// }
```

### Test Document Upload
1. Go to admin portal
2. Start driver registration
3. Upload documents in Step 3
4. Verify files appear in S3 bucket
5. Check encryption (should show ServerSideEncryption: AES256)

### Test Messaging
1. Register a driver with valid phone/email
2. Check delivery status in `DriverCredentialDelivery` table
3. Verify message received on phone/email
4. Test fallback by disabling WhatsApp

## Troubleshooting

### Document Upload Fails
- Check AWS credentials in .env
- Verify S3 bucket exists and is accessible
- Check file size (<5MB) and type (JPEG, PNG, WebP, PDF)
- Review browser console for errors

### Credentials Not Sent
- Check Twilio credentials
- Verify Resend API key
- Check phone number format (+7 for Kazakhstan)
- Review delivery logs in database

### Admin Access Denied
- Verify user has `role: "ADMIN"` in database
- Check session token is valid
- Review middleware logs

## Next Steps

1. **Testing**: Test complete registration flow
2. **Migrations**: Run Prisma migrations
3. **Seed Data**: Create test admin user
4. **Monitoring**: Set up alerts for failed deliveries
5. **Documentation**: Add API documentation with examples

## Support

For issues or questions:
- Email: dev-support@steppergo.com
- Slack: #engineering-support
- Documentation: https://docs.steppergo.com
