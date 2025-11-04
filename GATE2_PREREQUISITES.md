# Gate 2 Implementation Prerequisites

**Hi Mayu!** Here's everything you need before starting Gate 2 implementation.

---

## 📋 Table of Contents
1. [Technical Infrastructure](#technical-infrastructure)
2. [External Services Setup](#external-services-setup)
3. [Development Environment](#development-environment)
4. [Database Requirements](#database-requirements)
5. [Security & Compliance](#security--compliance)
6. [Design & UX Assets](#design--ux-assets)
7. [Implementation Checklist](#implementation-checklist)

---

## 🏗 Technical Infrastructure

### Required NPM Packages

```json
{
  "dependencies": {
    // Database & ORM
    "@prisma/client": "^6.18.0",
    "prisma": "^6.18.0",
    
    // Payment Processing
    "stripe": "^16.12.0",
    "@stripe/stripe-js": "^4.8.0",
    "@stripe/react-stripe-js": "^2.8.1",
    
    // Analytics
    "posthog-js": "^1.165.0",
    "posthog-node": "^4.2.0",
    
    // Communication
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.25",
    "twilio": "^5.3.3",
    
    // File Upload & Storage
    "@aws-sdk/client-s3": "^3.682.0",
    "@aws-sdk/s3-request-presigner": "^3.682.0",
    
    // Phone Number Handling
    "libphonenumber-js": "^1.11.11",
    "react-phone-number-input": "^3.4.8",
    
    // Background Job Processing
    "bullmq": "^5.19.6",
    "ioredis": "^5.4.1",
    
    // ID Generation
    "nanoid": "^5.0.8",
    "uuid": "^10.0.0",
    
    // Utilities
    "date-fns-tz": "^3.2.0"
  },
  "devDependencies": {
    "@types/stripe": "^8.0.0",
    "@types/uuid": "^10.0.0"
  }
}
```

### Package Installation Script

```bash
#!/bin/bash
# install-gate2-deps.sh

echo "📦 Installing Gate 2 Dependencies..."

# Core packages
npm install @prisma/client@^6.18.0 prisma@^6.18.0

# Payment
npm install stripe@^16.12.0 @stripe/stripe-js@^4.8.0 @stripe/react-stripe-js@^2.8.1

# Analytics
npm install posthog-js@^1.165.0 posthog-node@^4.2.0

# Communication
npm install resend@^4.0.0 @react-email/components@^0.0.25 twilio@^5.3.3

# File storage
npm install @aws-sdk/client-s3@^3.682.0 @aws-sdk/s3-request-presigner@^3.682.0

# Phone handling
npm install libphonenumber-js@^1.11.11 react-phone-number-input@^3.4.8

# Background jobs
npm install bullmq@^5.19.6 ioredis@^5.4.1

# Utilities
npm install nanoid@^5.0.8 uuid@^10.0.0 date-fns-tz@^3.2.0

# Dev dependencies
npm install -D @types/stripe@^8.0.0 @types/uuid@^10.0.0

echo "✅ All Gate 2 dependencies installed!"
```

---

## 🔌 External Services Setup

### 1. Database (PostgreSQL)

#### Option A: Supabase (Current - Recommended)
```bash
# Already configured in Gate 1
DATABASE_URL="postgresql://postgres.xrbztqndbqijwzrzqknb:Paikbos..1@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.xrbztqndbqijwzrzqknb:Paikbos..1@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Status**: ✅ Already setup
**Action**: Verify connection and sufficient resources

#### Option B: Railway (Alternative)
```bash
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

**Required Steps**:
- [ ] Sign up at https://railway.app
- [ ] Create new PostgreSQL instance
- [ ] Copy connection string
- [ ] Update `.env` file

---

### 2. Payment Gateway (Stripe)

#### Account Setup
**URL**: https://dashboard.stripe.com

**Required Steps**:
1. [ ] Create Stripe account
2. [ ] Activate account (provide business info)
3. [ ] Get test mode API keys
4. [ ] Get production mode API keys (when ready)
5. [ ] Configure webhook endpoints
6. [ ] Enable Kazakhstan region if using local cards

#### Configuration

```bash
# Test Mode (Development)
STRIPE_SECRET_KEY="sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Production Mode (After approval)
# STRIPE_SECRET_KEY="sk_live_..."
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Webhook Setup
**Endpoint**: `https://yourdomain.com/api/webhooks/stripe`
**Events to Subscribe**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.refunded`

**Testing Locally**:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

---

### 3. Local Payment Gateway (Kaspi Pay - Kazakhstan)

**Required for**: Kazakhstan market
**URL**: https://kaspi.kz/business

**Required Steps**:
1. [ ] Create Kaspi Business account
2. [ ] Apply for Kaspi Pay merchant account
3. [ ] Complete verification (requires Kazakhstan business registration)
4. [ ] Get API credentials
5. [ ] Configure webhook endpoint

```bash
KASPI_MERCHANT_ID="your_merchant_id"
KASPI_API_KEY="your_api_key"
KASPI_WEBHOOK_SECRET="your_webhook_secret"
```

**Note**: This may take 1-2 weeks for approval. Use Stripe for initial demo.

---

### 4. Analytics (PostHog)

**URL**: https://posthog.com

**Required Steps**:
1. [ ] Create PostHog account (free tier available)
2. [ ] Create new project
3. [ ] Copy API key
4. [ ] Configure feature flags (optional)

```bash
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

**Events to Track** (Gate 2):
- `trip_viewed` - User views trip details
- `checkout_started` - User begins booking
- `payment_attempted` - User submits payment
- `payment_succeeded` - Payment successful
- `payment_failed` - Payment failed
- `booking_confirmed` - Booking finalized
- `driver_application_started` - Driver begins application
- `driver_application_submitted` - Driver submits application
- `whatsapp_group_joined` - User joins trip group

---

### 5. Email Service (Resend)

**URL**: https://resend.com

**Required Steps**:
1. [ ] Create Resend account (free: 100 emails/day)
2. [ ] Add and verify sending domain
3. [ ] Copy API key

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@steppergo.com"
RESEND_REPLY_TO="support@steppergo.com"
```

**Alternative**: Postmark (https://postmarkapp.com)
```bash
POSTMARK_SERVER_TOKEN="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
POSTMARK_FROM_EMAIL="noreply@steppergo.com"
```

**Email Templates Needed**:
- [ ] Booking confirmation
- [ ] Payment receipt
- [ ] Driver application received
- [ ] Driver approved/rejected
- [ ] Trip reminder (24h before)
- [ ] Trip cancellation
- [ ] Password reset
- [ ] Welcome email

---

### 6. SMS Service (Twilio)

**URL**: https://www.twilio.com

**Required Steps**:
1. [ ] Create Twilio account
2. [ ] Get phone number (Kazakhstan region: +7)
3. [ ] Verify account for production
4. [ ] Copy credentials

```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+77001234567"
```

**SMS Use Cases**:
- OTP verification (registration)
- Booking confirmation
- Trip reminders
- Emergency notifications

**Free Tier**: $15 credit (≈ 600 SMS)

---

### 7. File Storage (AWS S3 or Supabase Storage)

#### Option A: Supabase Storage (Recommended)
```bash
# Already included in Supabase setup
NEXT_PUBLIC_SUPABASE_URL="https://xrbztqndbqijwzrzqknb.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

**Buckets to Create**:
- `driver-documents` (private)
- `vehicle-photos` (public)
- `trip-images` (public)
- `user-avatars` (public)

#### Option B: AWS S3
```bash
AWS_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="steppergo-uploads"
```

---

### 8. Background Job Queue (Redis + BullMQ)

#### Option A: Upstash Redis (Serverless - Recommended)
**URL**: https://upstash.com

```bash
REDIS_URL="rediss://default:xxxxxxxxxxxxxxxxxxxx@us1-xxxxxx.upstash.io:6379"
```

**Free Tier**: 10,000 commands/day

#### Option B: Redis Cloud
**URL**: https://redis.com

```bash
REDIS_URL="redis://default:xxxxxx@redis-xxxxx.cloud.redislabs.com:xxxxx"
```

**Use Cases**:
- Email queue
- SMS queue
- Payment processing retries
- Analytics event batching
- Document processing (OCR)

---

### 9. WhatsApp Business API (Optional for Gate 2)

**URL**: https://business.whatsapp.com

**Status**: ⚠️ Manual group links sufficient for MVP
**Future Enhancement**: Automated group creation

**For Now**: Use manual WhatsApp group creation
```bash
# Store group invite links in database
# No API key required initially
```

---

## 💻 Development Environment

### Required Tools

```bash
# Node.js & Package Manager
node --version  # Should be >= 18.17.0
npm --version   # Should be >= 9.6.0

# Database CLI
psql --version  # PostgreSQL client

# Version Control
git --version

# Optional but recommended
docker --version  # For local services
```

### Local Environment Setup

```bash
# Clone repository (if not done)
git clone https://github.com/your-org/steppergo.git
cd steppergo

# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Install Gate 2 dependencies
chmod +x install-gate2-deps.sh
./install-gate2-deps.sh

# Initialize database
npx prisma generate
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

---

## 🗄 Database Requirements

### Prisma Schema Extensions

**File**: `prisma/schema.prisma`

#### New Models Required:

1. **User Enhancement**
```prisma
model User {
  // Existing fields...
  
  // New fields for Gate 2
  phoneVerified      Boolean   @default(false)
  preferredLanguage  String    @default("en")
  walletBalance      Decimal   @default(0)
  
  // Relations
  bookings           Booking[]
  driver             Driver?
  payments           Payment[]
}
```

2. **Booking Model**
```prisma
model Booking {
  id            String        @id @default(cuid())
  tripId        String
  userId        String
  status        BookingStatus
  seatsBooked   Int
  totalAmount   Decimal
  currency      String        @default("KZT")
  passengers    Json          // Array of passenger details
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  confirmedAt   DateTime?
  cancelledAt   DateTime?
  
  trip          Trip          @relation(fields: [tripId], references: [id])
  user          User          @relation(fields: [userId], references: [id])
  payment       Payment?
  
  @@index([tripId])
  @@index([userId])
  @@index([status])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

3. **Payment Model**
```prisma
model Payment {
  id                String        @id @default(cuid())
  bookingId         String        @unique
  userId            String
  
  // Payment Gateway
  provider          PaymentProvider
  stripeIntentId    String?       @unique
  kaspiOrderId      String?       @unique
  
  // Amounts
  amount            Decimal
  currency          String        @default("KZT")
  platformFee       Decimal
  processingFee     Decimal
  
  // Status
  status            PaymentStatus
  failureReason     String?
  
  // Metadata
  metadata          Json?
  receiptUrl        String?
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  paidAt            DateTime?
  refundedAt        DateTime?
  
  booking           Booking       @relation(fields: [bookingId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
}

enum PaymentProvider {
  STRIPE
  KASPI
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

4. **Driver Model**
```prisma
model Driver {
  id                String        @id @default(cuid())
  userId            String        @unique
  
  // Status
  status            DriverStatus  @default(PENDING)
  
  // Vehicle Info
  vehicleType       String
  vehicleModel      String
  vehicleMake       String
  vehicleYear       Int
  licensePlate      String
  vehicleColor      String
  
  // Documents
  licenseNumber     String
  licenseExpiry     DateTime
  documentsUrl      Json          // Array of document URLs
  
  // Performance
  rating            Float         @default(0)
  completedTrips    Int           @default(0)
  totalEarnings     Decimal       @default(0)
  
  // Timestamps
  appliedAt         DateTime      @default(now())
  approvedAt        DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  user              User          @relation(fields: [userId], references: [id])
  trips             Trip[]
  
  @@index([status])
  @@index([userId])
}

enum DriverStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

5. **Analytics Event Model**
```prisma
model AnalyticsEvent {
  id            String   @id @default(cuid())
  eventName     String
  userId        String?
  sessionId     String?
  properties    Json
  
  createdAt     DateTime @default(now())
  
  @@index([eventName])
  @@index([userId])
  @@index([createdAt])
}
```

### Database Migration Commands

```bash
# Create migration
npx prisma migrate dev --name add_gate2_models

# Apply migration
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# View database in browser
npx prisma studio
```

---

## 🔒 Security & Compliance

### Required Security Measures

#### 1. PCI DSS Compliance (Payment Card Industry)
- [ ] Never store raw card numbers
- [ ] Use Stripe.js for card tokenization
- [ ] All payment pages served over HTTPS
- [ ] Implement webhook signature verification
- [ ] Use strong encryption for sensitive data

#### 2. GDPR Compliance (Data Protection)
- [ ] Privacy policy page created
- [ ] Cookie consent implementation
- [ ] User data export capability
- [ ] User data deletion capability
- [ ] Data retention policy defined

#### 3. Authentication Security
```typescript
// Required: Secure session management
// File: src/lib/auth/session.ts

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET!;
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(SESSION_SECRET));
    
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION
  });
}
```

**Environment Variables**:
```bash
SESSION_SECRET="your-super-secret-session-key-minimum-32-characters"
ENCRYPTION_KEY="your-encryption-key-for-sensitive-data"
```

#### 4. Rate Limiting
```bash
# Install rate limiter
npm install @upstash/ratelimit @upstash/redis
```

**Implementation**:
```typescript
// File: src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true
});
```

---

## 🎨 Design & UX Assets

### Required Design Assets

#### 1. Email Templates
**Tool**: React Email (https://react.email)

**Templates to Create**:
- [ ] `booking-confirmation.tsx` - Booking details with trip info
- [ ] `payment-receipt.tsx` - Payment confirmation with receipt
- [ ] `driver-application-received.tsx` - Application acknowledgment
- [ ] `driver-approved.tsx` - Driver approval notification
- [ ] `trip-reminder.tsx` - 24h before trip departure
- [ ] `trip-cancelled.tsx` - Cancellation notification
- [ ] `welcome-email.tsx` - New user welcome

**Example Structure**:
```tsx
// emails/booking-confirmation.tsx
import { Html, Body, Container, Section, Text } from '@react-email/components';

export default function BookingConfirmation({ booking }: Props) {
  return (
    <Html>
      <Body>
        <Container>
          <Section>
            <Text>Your booking is confirmed!</Text>
            {/* Template content */}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 2. UI Components
**Required New Components**:
- [ ] Payment form with Stripe Elements
- [ ] Booking stepper (passenger details → payment → confirmation)
- [ ] Driver application multi-step form
- [ ] Document upload component
- [ ] WhatsApp integration button
- [ ] Analytics funnel visualization (admin)

#### 3. Icons & Images
**Required Assets**:
- [ ] Payment method logos (Stripe, Kaspi, Visa, Mastercard)
- [ ] WhatsApp logo and integration assets
- [ ] Success/error state illustrations
- [ ] Empty state illustrations
- [ ] Loading animations

**Storage Location**: `/public/assets/`

---

## ✅ Implementation Checklist

### Pre-Development (Complete Before Coding)

#### Week 1: Account Setup
- [ ] **Day 1**: Stripe account setup and verification
- [ ] **Day 1**: PostHog analytics account
- [ ] **Day 2**: Email service (Resend) setup
- [ ] **Day 2**: SMS service (Twilio) setup
- [ ] **Day 3**: Redis/Upstash account for queues
- [ ] **Day 3**: Verify Supabase resources sufficient
- [ ] **Day 4**: Domain DNS configuration (if custom domain)
- [ ] **Day 5**: SSL certificate setup
- [ ] **Day 5**: Environment variables documented

#### Week 2: Development Environment
- [ ] **Day 1**: Install all npm dependencies
- [ ] **Day 1**: Configure Prisma schema
- [ ] **Day 2**: Run database migrations
- [ ] **Day 2**: Seed test data
- [ ] **Day 3**: Set up Stripe CLI for webhooks
- [ ] **Day 3**: Configure PostHog tracking
- [ ] **Day 4**: Create email templates
- [ ] **Day 5**: Test all integrations locally

### Development Phase (During Implementation)

#### Sprint 1: Authentication & User Management
- [ ] OTP-based phone registration
- [ ] Email registration
- [ ] Session management
- [ ] User profile completion

#### Sprint 2: Booking System
- [ ] Booking flow UI
- [ ] Capacity lock logic
- [ ] Passenger details form
- [ ] Booking confirmation

#### Sprint 3: Payment Integration
- [ ] Stripe checkout implementation
- [ ] Webhook handlers
- [ ] Payment status tracking
- [ ] Receipt generation
- [ ] Admin payment dashboard

#### Sprint 4: Driver Application
- [ ] Multi-step application form
- [ ] Document upload
- [ ] Admin review interface
- [ ] Driver approval workflow
- [ ] Driver profile display

#### Sprint 5: Analytics & Notifications
- [ ] PostHog event tracking
- [ ] Conversion funnel setup
- [ ] Email notifications
- [ ] SMS notifications
- [ ] WhatsApp integration

#### Sprint 6: Testing & Polish
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] E2E tests with Playwright
- [ ] Performance optimization
- [ ] Security audit
- [ ] Mobile responsiveness

---

## 🚀 Ready to Start?

### Quick Start Commands

```bash
# 1. Install all dependencies
./install-gate2-deps.sh

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Initialize database
npx prisma generate
npx prisma migrate dev

# 4. Seed database
npx prisma db seed

# 5. Start development
npm run dev

# 6. In separate terminal: Stripe webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

---

## 📞 Support & Resources

### Documentation Links
- **Stripe**: https://stripe.com/docs
- **Prisma**: https://www.prisma.io/docs
- **PostHog**: https://posthog.com/docs
- **Resend**: https://resend.com/docs
- **Twilio**: https://www.twilio.com/docs
- **Next.js**: https://nextjs.org/docs

### Common Issues & Solutions

#### Issue: Database connection failed
**Solution**: Check DATABASE_URL format and network access

#### Issue: Stripe webhook signature verification failed
**Solution**: Ensure STRIPE_WEBHOOK_SECRET matches Stripe CLI output

#### Issue: PostHog events not appearing
**Solution**: Check API key and verify project ID

#### Issue: Email delivery fails
**Solution**: Verify domain DNS settings and SPF/DKIM records

---

## 📊 Cost Estimation (Monthly)

### Free Tier Services
- **Supabase**: Free (up to 500MB database, 2GB bandwidth)
- **PostHog**: Free (up to 1M events/month)
- **Resend**: Free (100 emails/day)
- **Upstash Redis**: Free (10K commands/day)
- **Vercel**: Free (hobby tier)

### Paid Services (When Scaling)
- **Stripe**: 2.9% + $0.30 per transaction
- **Twilio**: $0.0079 per SMS (≈ $7.90 per 1000 SMS)
- **Supabase Pro**: $25/month (when exceeding free tier)
- **PostHog**: $0 - $450/month (based on usage)

**Estimated Monthly Cost (MVP)**: $0 - $50
**Estimated Monthly Cost (Production)**: $100 - $500

---

## 🎯 Success Criteria

### Before Starting Gate 2
- ✅ All external accounts created and verified
- ✅ All API keys obtained and tested
- ✅ Database schema designed and reviewed
- ✅ Email templates designed
- ✅ Local development environment working
- ✅ Team has access to all services

### Ready for Production
- ✅ All services upgraded to production tier
- ✅ Custom domain configured
- ✅ SSL certificates active
- ✅ Monitoring and alerts configured
- ✅ Backup strategy implemented
- ✅ Incident response plan documented

---

**Questions or blockers?** Let me know and I'll help you resolve them! 🚀
