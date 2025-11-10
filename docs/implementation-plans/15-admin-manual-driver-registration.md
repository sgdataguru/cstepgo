# 15 - Admin Manual Driver Registration - Implementation Plan

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS  
**Backend**: NestJS/Next.js API Routes, Prisma ORM, PostgreSQL  
**Communications**: Twilio (SMS + WhatsApp), SendGrid (Email)  
**Storage**: AWS S3 (driver documents), encryption at rest  
**Related Stories**: Story E1/E2 (Admin Portal), Story D1 (Driver Login)

## User Story
**As an** admin,  
**I want** to manually register drivers on their behalf,  
**so that** I can onboard drivers quickly without requiring them to go through self-registration (trust-building phase).

## Pre-conditions
- ⏳ Admin authentication and role-based access control
- ✅ PostgreSQL database with user and driver tables
- ⏳ Twilio account configured (WhatsApp + SMS)
- ⏳ AWS S3 bucket for document storage
- ⏳ SendGrid for email delivery

## Business Requirements
- **Fast Onboarding**: <5 minutes to register a driver (admin side)
- **High Adoption**: >90% drivers log in within 48 hours
- **Delivery Success**: >95% credential delivery success rate
- **Migration Goal**: Onboard 100 existing inDriver drivers within 2 weeks
- **Trust Building**: Manual registration establishes relationship before public sign-up

## Technical Specifications

### Credential Generation System
```typescript
interface DriverCredentials {
  driverId: string;      // DRV-20251106-AB123
  tempPassword: string;  // Kgz2024! (8 chars)
  loginUrl: string;      // https://steppergo.com/driver/login
}

function generateDriverCredentials(): DriverCredentials {
  const today = format(new Date(), 'yyyyMMdd');
  const randomSuffix = randomAlphanumeric(5, { uppercase: true });
  const driverId = `DRV-${today}-${randomSuffix}`;
  
  // Generate secure password: 8 chars, mix of upper/lower/numbers/symbols
  const tempPassword = generatePassword({
    length: 8,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false, // Avoid symbols for easy SMS delivery
  });
  
  return {
    driverId,
    tempPassword,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/driver/login`,
  };
}

function generatePassword(options: PasswordOptions): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Exclude l
  const numbers = '23456789'; // Exclude 0, 1
  
  let charset = '';
  let password = '';
  
  if (options.uppercase) charset += uppercase;
  if (options.lowercase) charset += lowercase;
  if (options.numbers) charset += numbers;
  
  // Ensure at least one of each type
  if (options.uppercase) password += uppercase[Math.floor(Math.random() * uppercase.length)];
  if (options.lowercase) password += lowercase[Math.floor(Math.random() * lowercase.length)];
  if (options.numbers) password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill remaining length
  for (let i = password.length; i < options.length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

### Database Schema
```prisma
model User {
  id              String    @id @default(uuid())
  phone           String    @unique
  email           String?
  passwordHash    String
  role            UserRole
  isFirstLogin    Boolean   @default(true)
  
  driver          Driver?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum UserRole {
  DRIVER
  PASSENGER
  ADMIN
}

model Driver {
  id                String    @id @default(uuid())
  driverId          String    @unique // DRV-20251106-AB123
  userId            String    @unique
  
  // Personal Information
  fullName          String
  nationalId        String
  
  // Vehicle Information
  vehicleType       VehicleType
  vehicleMake       String
  vehicleModel      String
  vehicleYear       Int
  licensePlate      String    @unique
  vehicleColor      String
  seatCapacity      Int
  
  // Service Area
  homeLocation      Unsupported("geometry(Point, 4326)")? // PostGIS
  homeCity          String
  serviceRadiusKm   Int       @default(50)
  willingToTravel   Json      // Array of strings: ["domestic", "cross_border_kz"]
  
  // Documents (S3 URLs)
  documentsUrl      Json      // { license, registration, insurance, profilePhoto }
  
  // Status
  status            DriverStatus @default(PENDING)
  
  // Admin Tracking
  registeredBy      String    // Admin user ID
  registeredAt      DateTime  @default(now())
  lastLoginAt       DateTime?
  
  user              User      @relation(fields: [userId], references: [id])
  trips             Trip[]
  
  @@index([status])
  @@index([driverId])
}

enum DriverStatus {
  PENDING
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum VehicleType {
  SEDAN
  VAN
  MINIBUS
  SUV
}

model DriverCredentialDelivery {
  id              String    @id @default(uuid())
  driverId        String
  channel         DeliveryChannel
  status          DeliveryStatus
  sentAt          DateTime  @default(now())
  deliveredAt     DateTime?
  errorMessage    String?
  
  driver          Driver    @relation(fields: [driverId], references: [id])
  
  @@index([driverId, channel])
}

enum DeliveryChannel {
  WHATSAPP
  SMS
  EMAIL
}

enum DeliveryStatus {
  SENT
  DELIVERED
  FAILED
  READ
}
```

### WhatsApp/SMS Messaging Templates
```typescript
interface CredentialMessage {
  whatsapp: string;
  sms: string;
  email: EmailTemplate;
}

function getCredentialMessage(credentials: DriverCredentials, driverName: string): CredentialMessage {
  const { driverId, tempPassword, loginUrl } = credentials;
  
  const whatsappMessage = `Welcome to StepperGO! 🚗

Your driver account has been created:

Login URL: ${loginUrl}
Driver ID: ${driverId}
Temporary Password: ${tempPassword}

Please change your password after first login.

Support: ${process.env.SUPPORT_PHONE}`;

  const smsMessage = `StepperGO Driver Account Created
Login: ${loginUrl}
ID: ${driverId}
Pass: ${tempPassword}
Change password after first login.
Support: ${process.env.SUPPORT_PHONE}`;

  const emailTemplate = {
    subject: 'Welcome to StepperGO - Your Driver Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="StepperGO" style="width: 200px;" />
        <h2>Welcome, ${driverName}!</h2>
        <p>Your driver account has been created. Here are your login credentials:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Driver ID:</strong> ${driverId}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p><strong>⚠️ Important:</strong> Please change your password after first login.</p>
        <p>If you have any questions, contact support at ${process.env.SUPPORT_PHONE}</p>
      </div>
    `,
  };
  
  return { whatsapp: whatsappMessage, sms: smsMessage, email: emailTemplate };
}
```

### Twilio Integration
```typescript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(phone: string, message: string): Promise<DeliveryStatus> {
  try {
    const result = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
      body: message,
    });
    
    return result.status === 'sent' ? DeliveryStatus.SENT : DeliveryStatus.FAILED;
  } catch (error) {
    console.error('WhatsApp delivery failed:', error);
    return DeliveryStatus.FAILED;
  }
}

async function sendSMS(phone: string, message: string): Promise<DeliveryStatus> {
  try {
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
      body: message,
    });
    
    return result.status === 'sent' ? DeliveryStatus.SENT : DeliveryStatus.FAILED;
  } catch (error) {
    console.error('SMS delivery failed:', error);
    return DeliveryStatus.FAILED;
  }
}

async function sendCredentials(
  driver: Driver,
  credentials: DriverCredentials
): Promise<{ success: boolean; channels: Record<DeliveryChannel, DeliveryStatus> }> {
  const messages = getCredentialMessage(credentials, driver.fullName);
  const deliveryResults: Record<DeliveryChannel, DeliveryStatus> = {} as any;
  
  // Try WhatsApp first (preferred)
  deliveryResults.WHATSAPP = await sendWhatsAppMessage(driver.user.phone, messages.whatsapp);
  
  // Fallback to SMS if WhatsApp fails
  if (deliveryResults.WHATSAPP === DeliveryStatus.FAILED) {
    deliveryResults.SMS = await sendSMS(driver.user.phone, messages.sms);
  }
  
  // Send email if provided
  if (driver.user.email) {
    deliveryResults.EMAIL = await sendEmail(driver.user.email, messages.email);
  }
  
  // Log delivery attempts
  await Promise.all(
    Object.entries(deliveryResults).map(([channel, status]) =>
      prisma.driverCredentialDelivery.create({
        data: {
          driverId: driver.id,
          channel: channel as DeliveryChannel,
          status,
        },
      })
    )
  );
  
  const success = Object.values(deliveryResults).some(status => status !== DeliveryStatus.FAILED);
  return { success, channels: deliveryResults };
}
```

## Design Specifications

### Admin Driver Registration Form

**Page Layout** (`/admin/drivers/new`):
```
┌─────────────────────────────────────────────────┐
│  ← Back to Drivers                              │
├─────────────────────────────────────────────────┤
│  Register New Driver                            │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│  ─────────────────────────────                  │
│  Full Name: [_____________________________]    │
│  Phone: +996 [___________________________]     │
│  Email (optional): [______________________]    │
│  National ID: [___________________________]    │
│                                                  │
│  Vehicle Information                            │
│  ─────────────────────────────                  │
│  Type: [Dropdown: Sedan/Van/Mini-bus/SUV]      │
│  Make: [______________] Model: [__________]    │
│  Year: [____] Color: [__________________]      │
│  License Plate: [_________________________]    │
│  Seat Capacity: [__] seats                      │
│                                                  │
│  Service Area                                   │
│  ─────────────────────────────                  │
│  Home City: [Dropdown: Bishkek/Almaty/Osh...]  │
│  Service Radius: [50] km                        │
│  ☑ Domestic only                                │
│  ☐ Cross-border: Kyrgyzstan-Kazakhstan          │
│                                                  │
│  Documents Upload                               │
│  ─────────────────────────────                  │
│  Driver's License: [Choose File] 📄             │
│  Vehicle Registration: [Choose File] 📄         │
│  Insurance Certificate: [Choose File] 📄        │
│  Profile Photo (opt): [Choose File] 📷         │
│                                                  │
│  [Cancel]  [Register Driver]                    │
└─────────────────────────────────────────────────┘
```

**Success Modal** (after registration):
```
┌─────────────────────────────────────────────────┐
│  ✅ Driver Registered Successfully!             │
├─────────────────────────────────────────────────┤
│  Driver: Ali Khan                               │
│  Phone: +996 555 123 456                        │
│                                                  │
│  Credentials Generated:                         │
│  ──────────────────────                         │
│  Driver ID: DRV-20251106-AB123                  │
│  Temporary Password: Kgz2024!                   │
│                                                  │
│  Share credentials via:                         │
│  ──────────────────────                         │
│  ✅ WhatsApp: Sent successfully                 │
│  ⏭️ SMS: Not sent (WhatsApp succeeded)          │
│  ✅ Email: Sent to ali@example.com              │
│                                                  │
│  [View Driver Profile]  [Register Another]     │
└─────────────────────────────────────────────────┘
```

### Driver List View

**Page Layout** (`/admin/drivers`):
```
┌─────────────────────────────────────────────────┐
│  Drivers (156)                [+ New Driver]    │
├─────────────────────────────────────────────────┤
│  Filters:                                       │
│  Status: [All ▾] Vehicle: [All ▾]               │
│  Search: [🔍 Name, phone, or ID____________]    │
├─────────────────────────────────────────────────┤
│  ID          Name      Phone       Vehicle  ... │
│  ──────────────────────────────────────────     │
│  DRV-..123   Ali Khan  +996 555..  Van     ...  │
│  [Active] Registered: Nov 6, 2025 | Login: 2h ago│
│  [Edit] [View Trips] [Deactivate]              │
│  ──────────────────────────────────────────     │
│  DRV-..456   Sara Lee  +996 700..  Sedan   ...  │
│  [Pending] Registered: Nov 5, 2025 | Never logged in│
│  [Edit] [Send Reminder] [Delete]               │
└─────────────────────────────────────────────────┘
```

### Design System Compliance

**Status Badges**:
```css
.status-badge-active {
  @apply bg-green-100 text-green-800 border-green-300;
}

.status-badge-pending {
  @apply bg-yellow-100 text-yellow-800 border-yellow-300;
}

.status-badge-inactive {
  @apply bg-gray-100 text-gray-800 border-gray-300;
}

.status-badge-suspended {
  @apply bg-red-100 text-red-800 border-red-300;
}
```

**Form Styling**:
```tsx
<form className="max-w-4xl mx-auto p-6 space-y-8">
  <section className="bg-white rounded-xl shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
            +996
          </span>
          <input
            type="tel"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-turquoise"
            pattern="[0-9]{9}"
            placeholder="555 123 456"
            required
          />
        </div>
      </div>
    </div>
  </section>
</form>
```

## Technical Architecture

### Component Structure
```
src/app/admin/drivers/
├── page.tsx                           # Driver list view
├── new/
│   ├── page.tsx                       # Registration form page
│   └── components/
│       ├── DriverRegistrationForm.tsx
│       ├── SuccessModal.tsx
│       └── DocumentUploader.tsx
├── [driverId]/
│   ├── page.tsx                       # Driver profile view
│   └── edit/
│       └── page.tsx                   # Edit driver info
└── components/
    ├── DriverTable.tsx                # List view table
    ├── DriverFilters.tsx              # Filter sidebar
    ├── StatusBadge.tsx
    └── hooks/
        ├── useDriverRegistration.ts
        ├── useDocumentUpload.ts
        └── useCredentialDelivery.ts
```

### API Integration Schema

**Endpoint**: `POST /api/admin/drivers`

**Request**:
```json
{
  "fullName": "Ali Khan",
  "phone": "+996555123456",
  "email": "ali@example.com",
  "nationalId": "12345678901234",
  "vehicleType": "VAN",
  "vehicleMake": "Toyota",
  "vehicleModel": "Hiace",
  "vehicleYear": 2020,
  "licensePlate": "01KG123ABC",
  "vehicleColor": "White",
  "seatCapacity": 12,
  "homeCity": "Bishkek",
  "serviceRadiusKm": 50,
  "willingToTravel": ["domestic", "cross_border_kz"],
  "documents": {
    "license": "base64_or_s3_url",
    "registration": "base64_or_s3_url",
    "insurance": "base64_or_s3_url",
    "profilePhoto": "base64_or_s3_url"
  }
}
```

**Response**:
```json
{
  "success": true,
  "driver": {
    "id": "uuid",
    "driverId": "DRV-20251106-AB123",
    "fullName": "Ali Khan",
    "phone": "+996555123456",
    "status": "PENDING"
  },
  "credentials": {
    "driverId": "DRV-20251106-AB123",
    "tempPassword": "Kgz2024!",
    "loginUrl": "https://steppergo.com/driver/login"
  },
  "delivery": {
    "whatsapp": "SENT",
    "sms": "NOT_SENT",
    "email": "DELIVERED"
  }
}
```

## Implementation Requirements

### Core Components

1. **DriverRegistrationForm.tsx** - Multi-section form
   ```tsx
   interface DriverRegistrationFormProps {
     onSuccess: (driver: Driver, credentials: DriverCredentials) => void;
     onError: (error: Error) => void;
   }
   ```

2. **DocumentUploader.tsx** - File upload with S3
   ```tsx
   interface DocumentUploaderProps {
     label: string;
     accept: string;
     maxSize: number; // in bytes
     onUpload: (url: string) => void;
   }
   ```

3. **SuccessModal.tsx** - Credential display
   ```tsx
   interface SuccessModalProps {
     driver: Driver;
     credentials: DriverCredentials;
     deliveryStatus: Record<DeliveryChannel, DeliveryStatus>;
     onClose: () => void;
   }
   ```

4. **DriverTable.tsx** - List view
   ```tsx
   interface DriverTableProps {
     drivers: Driver[];
     onEdit: (driverId: string) => void;
     onDeactivate: (driverId: string) => void;
   }
   ```

### Custom Hooks

1. **useDriverRegistration.ts** - Form submission
   ```typescript
   function useDriverRegistration() {
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<Error | null>(null);
     
     const registerDriver = async (data: DriverRegistrationData) => {
       setIsLoading(true);
       setError(null);
       
       try {
         const response = await fetch('/api/admin/drivers', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data),
         });
         
         if (!response.ok) throw new Error('Registration failed');
         
         return await response.json();
       } catch (err) {
         setError(err as Error);
         throw err;
       } finally {
         setIsLoading(false);
       }
     };
     
     return { registerDriver, isLoading, error };
   }
   ```

2. **useDocumentUpload.ts** - S3 upload
   ```typescript
   function useDocumentUpload() {
     const uploadToS3 = async (file: File, documentType: string): Promise<string> => {
       // Get pre-signed URL
       const { url, fields } = await fetch('/api/admin/upload-url', {
         method: 'POST',
         body: JSON.stringify({ filename: file.name, type: documentType }),
       }).then(res => res.json());
       
       // Upload to S3
       const formData = new FormData();
       Object.entries(fields).forEach(([key, value]) => {
         formData.append(key, value as string);
       });
       formData.append('file', file);
       
       await fetch(url, { method: 'POST', body: formData });
       
       return `${url}/${fields.key}`;
     };
     
     return { uploadToS3 };
   }
   ```

## Acceptance Criteria

### Functional Requirements

✅ **Admin Driver Registration Portal**
- [ ] Accessible at `/admin/drivers/new`
- [ ] All required form fields validated
- [ ] Phone number uniqueness check
- [ ] License plate uniqueness check
- [ ] File uploads limited to 5MB
- [ ] Documents stored encrypted in S3

✅ **Auto-Generated Credentials**
- [ ] Driver ID format: DRV-YYYYMMDD-XXXXX
- [ ] Temporary password: 8 chars, mixed case + numbers
- [ ] Success modal displays credentials clearly
- [ ] Credentials logged for admin audit

✅ **Driver Credential Delivery**
- [ ] WhatsApp message sent (preferred)
- [ ] SMS fallback if WhatsApp fails
- [ ] Email sent if provided
- [ ] Delivery status tracked in database
- [ ] Admin sees confirmation of delivery

✅ **Driver List View**
- [ ] Table displays all drivers
- [ ] Filters by status, vehicle type, date range
- [ ] Search by name, phone, or Driver ID
- [ ] Actions: Edit, View Trips, Deactivate
- [ ] Status badges: Active, Pending, Inactive, Suspended

✅ **Security**
- [ ] Admin-only access (role check)
- [ ] Temporary passwords expire after 30 days
- [ ] Force password change on first login
- [ ] All admin actions logged
- [ ] Documents encrypted at rest

### Non-Functional Requirements

✅ **Performance**
- [ ] Form submission < 2 seconds
- [ ] Document upload < 10 seconds per file
- [ ] Driver list loads < 1 second (with pagination)

✅ **Usability**
- [ ] Clear form validation errors
- [ ] Progress indicators during upload
- [ ] Success confirmation with next steps

## Modified Files

```
src/
├── app/
│   └── admin/
│       ├── drivers/
│       │   ├── page.tsx ⬜                    # Driver list
│       │   ├── new/
│       │   │   ├── page.tsx ⬜                # Registration form
│       │   │   └── components/
│       │   │       ├── DriverRegistrationForm.tsx ⬜
│       │   │       ├── SuccessModal.tsx ⬜
│       │   │       └── DocumentUploader.tsx ⬜
│       │   ├── [driverId]/
│       │   │   ├── page.tsx ⬜                # Driver profile
│       │   │   └── edit/
│       │   │       └── page.tsx ⬜            # Edit driver
│       │   └── components/
│       │       ├── DriverTable.tsx ⬜
│       │       ├── DriverFilters.tsx ⬜
│       │       ├── StatusBadge.tsx ⬜
│       │       └── hooks/
│       │           ├── useDriverRegistration.ts ⬜
│       │           ├── useDocumentUpload.ts ⬜
│       │           └── useCredentialDelivery.ts ⬜
│       └── api/
│           ├── drivers/
│           │   └── route.ts ⬜                # POST /api/admin/drivers
│           ├── upload-url/
│           │   └── route.ts ⬜                # GET pre-signed S3 URL
│           └── drivers/
│               └── send-reminder/
│                   └── route.ts ⬜            # POST resend credentials
├── lib/
│   ├── auth/
│   │   └── credentials.ts ⬜                  # generateDriverCredentials()
│   ├── messaging/
│   │   ├── twilio.ts ⬜                       # sendWhatsApp(), sendSMS()
│   │   └── templates.ts ⬜                    # getCredentialMessage()
│   └── storage/
│       └── s3.ts ⬜                            # uploadDocument(), getPresignedUrl()
└── types/
    ├── driver.ts ⬜                            # Driver types
    └── credentials.ts ⬜                       # DriverCredentials types

prisma/
└── schema.prisma ⬜                            # Driver, User models
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- [08-apply-as-driver.md](./08-apply-as-driver.md) - Driver applications to approve (BLOCKER)
- Admin authentication system
- File storage system

**Enables**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Approved drivers create trips
- [06-view-driver-profile.md](./06-view-driver-profile.md) - Public driver profiles
- [11-manage-trip-settings.md](./11-manage-trip-settings.md) - Driver trip management

**Works With**:
- [07-register-as-passenger.md](./07-register-as-passenger.md) - Uses same OTP/auth system

**Related Epics**:
- **Epic E.2 - Admin (Driver Management)**: Driver approval workflow
- **Epic D - Driver Portal**: Creates driver access

**External Dependencies**:
- ⚠️ **Twilio/WhatsApp** - Credential delivery to drivers

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: Epic E.2

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#15---admin-manual-driver-registration)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Database & Auth ⬜
- [ ] Add Driver and User models to Prisma schema
- [ ] Add DriverCredentialDelivery tracking table
- [ ] Set up admin role-based access control
- [ ] Configure middleware for admin routes

### Phase 2: Credential Generation ⬜
- [ ] Implement `generateDriverCredentials()` function
- [ ] Add password hashing (bcrypt)
- [ ] Create audit logging for credential generation

### Phase 3: Document Upload (S3) ⬜
- [ ] Configure AWS S3 bucket
- [ ] Enable encryption at rest
- [ ] Implement pre-signed URL generation
- [ ] Build DocumentUploader component

### Phase 4: Messaging Integration ⬜
- [ ] Set up Twilio account (WhatsApp + SMS)
- [ ] Create message templates
- [ ] Implement sendWhatsApp() function
- [ ] Implement sendSMS() fallback
- [ ] Set up SendGrid for email

### Phase 5: Admin UI ⬜
- [ ] Build DriverRegistrationForm component
- [ ] Build DocumentUploader component
- [ ] Build SuccessModal component
- [ ] Build DriverTable and DriverFilters
- [ ] Add form validation (Zod/React Hook Form)

### Phase 6: API Endpoints ⬜
- [ ] POST /api/admin/drivers (registration)
- [ ] GET /api/admin/drivers (list with filters)
- [ ] PATCH /api/admin/drivers/[id] (edit)
- [ ] POST /api/admin/drivers/send-reminder (resend credentials)
- [ ] POST /api/admin/upload-url (S3 pre-signed URL)

### Phase 7: Testing & Security ⬜
- [ ] Unit tests for credential generation
- [ ] Integration tests for registration flow
- [ ] E2E tests for admin driver management
- [ ] Security audit (role checks, encryption)
- [ ] Load testing (100 driver uploads)

## Dependencies

### Internal Dependencies
- ⏳ Admin authentication (Admin role setup)
- ⏳ Driver login portal (Story D1)

### External Dependencies
- **Twilio**: WhatsApp + SMS delivery
- **AWS S3**: Document storage
- **SendGrid**: Email delivery

### New Package Installations
```json
{
  "dependencies": {
    "twilio": "^4.19.0",
    "@sendgrid/mail": "^7.7.0",
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "bcrypt": "^5.1.1",
    "zod": "^3.22.4",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

## Risk Assessment

### Technical Risks

**Risk 1: WhatsApp/SMS Delivery Failures**
- **Impact**: High (drivers don't receive credentials)
- **Mitigation**: Multi-channel delivery (WhatsApp → SMS → Email), track delivery status
- **Contingency**: Admin dashboard shows delivery failures, manual retry option

**Risk 2: Duplicate Phone Numbers**
- **Impact**: Medium (prevents registration)
- **Mitigation**: Unique constraint on phone field, clear error message
- **Contingency**: Admin can search existing driver, edit instead of re-register

**Risk 3: S3 Upload Failures**
- **Impact**: Medium (documents not saved)
- **Mitigation**: Retry logic, show upload progress
- **Contingency**: Allow registration without documents, mark as "incomplete"

### Business Risks

**Risk 1: Low Driver Login Rate**
- **Impact**: High (drivers don't activate accounts)
- **Mitigation**: Automated reminders after 24h/48h/7 days, phone call follow-up
- **Contingency**: Manual onboarding session with drivers

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Credential Generation', () => {
  it('should generate unique Driver ID with correct format', () => {
    const credentials = generateDriverCredentials();
    
    expect(credentials.driverId).toMatch(/^DRV-\d{8}-[A-Z0-9]{5}$/);
  });

  it('should generate secure password with mixed characters', () => {
    const credentials = generateDriverCredentials();
    
    expect(credentials.tempPassword).toHaveLength(8);
    expect(credentials.tempPassword).toMatch(/[A-Z]/);
    expect(credentials.tempPassword).toMatch(/[a-z]/);
    expect(credentials.tempPassword).toMatch(/[0-9]/);
  });
});
```

### E2E Tests (Playwright)
```typescript
test.describe('Admin Driver Registration', () => {
  test('should register driver and send credentials', async ({ page }) => {
    await page.goto('/admin/drivers/new');
    
    // Fill form
    await page.fill('input[name="fullName"]', 'Ali Khan');
    await page.fill('input[name="phone"]', '555123456');
    await page.selectOption('select[name="vehicleType"]', 'VAN');
    // ... fill other fields
    
    // Upload documents
    await page.setInputFiles('input[name="license"]', 'test-files/license.jpg');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success modal
    await expect(page.getByText('Driver Registered Successfully')).toBeVisible();
    await expect(page.getByText(/DRV-\d{8}-[A-Z0-9]{5}/)).toBeVisible();
    
    // Verify delivery status
    await expect(page.getByText('WhatsApp: Sent successfully')).toBeVisible();
  });
});
```

## Monitoring & Analytics

### Performance Metrics
- Registration completion time: Target <5 min (admin side)
- Document upload time: Target <10 sec per file
- API response time: Target <2 sec

### Business Metrics (PostHog)
- Event: `admin_driver_registered` (track registrations per day)
- Event: `driver_credentials_sent` (track delivery success rate)
- Event: `driver_first_login` (track activation rate)
- Event: `credential_delivery_failed` (alert on failures)

**Success Metrics**:
- Avg onboarding time: <5 minutes
- Driver first login rate: >90% within 48 hours
- Credential delivery success: >95%
- 100 drivers onboarded within 2 weeks

## Post-Launch Review

### Success Criteria (Week 1)
- [ ] 50+ drivers registered manually
- [ ] >90% credential delivery success
- [ ] >80% drivers logged in within 48h
- [ ] <5 duplicate phone number errors

### Success Criteria (Month 1)
- [ ] 100+ drivers fully onboarded
- [ ] All drivers have complete documents uploaded
- [ ] Zero security incidents (credential leaks)
- [ ] Admin feedback: "Easy and fast to use"

---

**Implementation Owner**: TBD  
**Estimated Effort**: 10-12 days (1 developer)  
**Priority**: Critical (Blocks driver onboarding for Gate 2)  
**Gate Assignment**: Gate 2 (Manual registration), Gate 4 (Self-registration portal)
