# 20 Driver Portal Authentication - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to access a dedicated driver portal with separate authentication, so that I can access driver-specific features and maintain platform security.

## Pre-conditions

- Existing customer authentication system is functional
- Database schema supports role-based user management
- Admin approval workflow system exists
- Document upload functionality is available

## Business Requirements

- Separate driver registration and authentication from customer system
- Document verification and background check integration
- Admin approval workflow before driver access is granted
- Role-based access control to prevent unauthorized access
- Secure session management for driver accounts

## Technical Specifications

### Integration Points
- **Authentication**: Extend existing Clerk/Supabase Auth with driver role separation
- **Document Upload**: File storage for license, insurance, vehicle registration
- **Admin Dashboard**: Integration with existing admin system for approval workflow
- **Role Management**: RBAC implementation with driver-specific permissions
- **Session Management**: Separate session handling for driver and customer users

### Security Requirements
- Driver document encryption at rest and transit
- Background check API integration (third-party service)
- Multi-factor authentication for driver accounts
- Separate JWT tokens with driver-specific claims
- Admin approval audit trail and logging

## Design Specifications

### Visual Layout & Components

**Driver Login Page Layout**:
```
[Header - StepperGO Driver Portal]
├── Logo with "Driver" badge
├── Navigation (minimal - just login/register)

[Main Content Area - Centered Card]
├── Login Form
│   ├── Email/Phone Input
│   ├── Password Input
│   ├── Remember Me Checkbox
│   └── Login Button
├── Separator "OR"
├── Register as Driver Link
└── Forgot Password Link

[Footer]
└── Legal Links & Support
```

**Driver Registration Flow**:
```
[Step 1: Basic Information]
├── Personal Details (Name, Phone, Email)
├── Vehicle Information (Make, Model, Year, License Plate)
└── Service Area Preferences

[Step 2: Document Upload]
├── Driver License (Front & Back)
├── Vehicle Insurance Certificate
├── Vehicle Registration
└── Background Check Consent

[Step 3: Verification & Review]
├── Document Review Status
├── Background Check Progress
└── Admin Approval Pending State
```

**Component Hierarchy**:
```tsx
<DriverAuthLayout>
  <DriverHeader />
  <DriverAuthContainer>
    {/* Login Flow */}
    <DriverLoginForm>
      <EmailInput />
      <PasswordInput />
      <LoginButton />
      <SocialLoginOptions />
    </DriverLoginForm>
    
    {/* Registration Flow */}
    <DriverRegistrationWizard>
      <StepIndicator />
      <PersonalInfoStep />
      <VehicleInfoStep />
      <DocumentUploadStep />
      <VerificationStep />
    </DriverRegistrationWizard>
  </DriverAuthContainer>
  <DriverFooter />
</DriverAuthLayout>
```

### Design System Compliance

**Color Palette (Driver-Specific)**:
```css
/* Driver Portal Colors */
--driver-primary: #059669;        /* bg-emerald-600 */
--driver-primary-hover: #047857;  /* bg-emerald-700 */
--driver-secondary: #374151;      /* bg-gray-700 */
--driver-accent: #f59e0b;         /* bg-amber-500 */

/* Status Colors */
--status-pending: #f59e0b;        /* bg-amber-500 */
--status-approved: #10b981;       /* bg-emerald-500 */
--status-rejected: #ef4444;       /* bg-red-500 */
```

**Typography Scale**:
```css
--driver-heading: 1.875rem;   /* text-3xl - Driver Portal */
--driver-subheading: 1.25rem; /* text-xl - Section headers */
--driver-body: 1rem;          /* text-base - Form text */
--driver-caption: 0.875rem;   /* text-sm - Help text */
```

### Responsive Behavior

**Breakpoints**:
```css
/* Mobile (< 768px) */
.driver-auth-mobile {
  width: 100%;
  padding: 1rem;
  margin: 0;
}

/* Tablet (768px - 1023px) */
.driver-auth-tablet {
  width: 90%;
  max-width: 500px;
  margin: 2rem auto;
}

/* Desktop (1024px+) */
.driver-auth-desktop {
  width: 80%;
  max-width: 600px;
  margin: 4rem auto;
}
```

**Layout Adaptations**:
```tsx
// Mobile: Stack form elements vertically
// Tablet: Two-column layout for document uploads
// Desktop: Side-by-side registration steps
```

### Interaction Patterns

**Button States**:
```typescript
interface DriverAuthButtonStates {
  primary: {
    default: 'bg-emerald-600 text-white';
    hover: 'bg-emerald-700';
    disabled: 'bg-gray-300 cursor-not-allowed';
    loading: 'bg-emerald-600 opacity-50';
  };
  secondary: {
    default: 'border border-emerald-600 text-emerald-600';
    hover: 'bg-emerald-50';
  };
}
```

**Form Validation**:
```typescript
interface DriverValidationPattern {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  phone: /^\+?[\d\s\-\(\)]+$/;
  licenseNumber: /^[A-Z0-9]{6,15}$/;
  plateNumber: /^[A-Z0-9\s]{2,10}$/;
}
```

## Technical Architecture

### Database Schema Changes

```sql
-- Extend user table with driver-specific fields
ALTER TABLE users ADD COLUMN user_role VARCHAR(20) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN driver_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP DEFAULT NULL;
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);

-- Create driver_profiles table
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_color VARCHAR(50),
  vehicle_capacity INTEGER DEFAULT 4,
  service_radius INTEGER DEFAULT 10,
  background_check_status VARCHAR(20) DEFAULT 'pending',
  background_check_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create driver_documents table
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID REFERENCES driver_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'license', 'insurance', 'registration'
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role ON users(user_role);
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_driver_documents_profile_id ON driver_documents(driver_profile_id);
```

### API Endpoints

```typescript
// Driver Authentication APIs
POST /api/drivers/register
POST /api/drivers/login
POST /api/drivers/refresh-token
POST /api/drivers/logout
GET /api/drivers/profile
PUT /api/drivers/profile

// Document Management APIs
POST /api/drivers/documents/upload
GET /api/drivers/documents
DELETE /api/drivers/documents/:id
PUT /api/drivers/documents/:id/verify

// Admin Approval APIs
GET /api/admin/drivers/pending
PUT /api/admin/drivers/:id/approve
PUT /api/admin/drivers/:id/reject
GET /api/admin/drivers/:id/documents
```

### Component Implementation

**DriverAuthProvider**:
```typescript
interface DriverAuthContext {
  driver: DriverUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: DriverRegistrationData) => Promise<void>;
  updateProfile: (data: Partial<DriverProfile>) => Promise<void>;
  uploadDocument: (file: File, type: DocumentType) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const DriverAuthProvider = ({ children }: { children: ReactNode }) => {
  // Implementation with separate driver session management
};
```

**DriverRegistrationWizard**:
```typescript
const DriverRegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DriverRegistrationData>({});
  
  const steps = [
    { component: PersonalInfoStep, title: 'Personal Information' },
    { component: VehicleInfoStep, title: 'Vehicle Information' },
    { component: DocumentUploadStep, title: 'Document Upload' },
    { component: VerificationStep, title: 'Verification' }
  ];
  
  // Implementation with validation and progress tracking
};
```

### Security Implementation

**Role-Based Access Control**:
```typescript
// Middleware for driver route protection
const withDriverAuth = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.cookies.driverToken;
    const payload = await verifyDriverToken(token);
    
    if (!payload || payload.role !== 'driver') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.driver = payload;
    return handler(req, res);
  };
};

// Route protection hook
const useDriverAuth = () => {
  const router = useRouter();
  const { driver, isLoading } = useContext(DriverAuthContext);
  
  useEffect(() => {
    if (!isLoading && !driver) {
      router.push('/drivers/login');
    }
  }, [driver, isLoading]);
  
  return { driver, isLoading };
};
```

## Implementation Steps

### Phase 1: Core Authentication (Week 1)
1. **Database Setup**
   - Create driver-specific tables
   - Add role-based user extensions
   - Set up document storage schema

2. **Backend APIs**
   - Driver registration endpoint
   - Driver login/logout endpoints
   - Document upload APIs
   - Admin approval endpoints

3. **Frontend Components**
   - Driver login page (`/drivers/login`)
   - Driver registration wizard
   - Document upload interface
   - Admin approval dashboard

### Phase 2: Security & Validation (Week 2)
1. **Authentication Security**
   - JWT token management for drivers
   - Role-based middleware implementation
   - Session separation from customers

2. **Document Verification**
   - File upload with validation
   - Document verification workflow
   - Admin review interface

3. **Background Checks**
   - Third-party API integration
   - Status tracking and updates
   - Approval/rejection workflow

### Phase 3: User Experience (Week 3)
1. **UI/UX Implementation**
   - Mobile-responsive design
   - Progress indicators
   - Error handling and validation

2. **Admin Dashboard**
   - Driver approval interface
   - Document review system
   - Bulk approval actions

3. **Testing & Security**
   - Unit tests for authentication
   - Integration tests for registration flow
   - Security penetration testing

## Testing Strategy

### Unit Tests
```typescript
describe('Driver Authentication', () => {
  test('should register driver with valid documents');
  test('should prevent duplicate driver registration');
  test('should require admin approval before access');
  test('should handle document upload errors');
});
```

### Integration Tests
```typescript
describe('Driver Registration Flow', () => {
  test('complete registration workflow');
  test('document verification process');
  test('admin approval workflow');
  test('role-based access control');
});
```

### Security Tests
- SQL injection prevention
- File upload security validation
- JWT token manipulation protection
- Role escalation prevention

## Rollout Strategy

### Deployment Phases
1. **Internal Testing** (Week 1): Core team validation
2. **Admin Testing** (Week 2): Admin approval workflow
3. **Beta Testing** (Week 3): Limited driver cohort
4. **Full Release** (Week 4): All driver registration enabled

### Monitoring & Analytics
- Registration completion rates
- Document verification times
- Admin approval workflow metrics
- Security incident tracking

## Dependencies

### External Services
- File storage service (AWS S3 / Cloudinary)
- Background check API (third-party provider)
- Email/SMS notification service
- Document OCR service (optional)

### Internal Dependencies
- Existing authentication system
- Admin dashboard infrastructure
- User management APIs
- Notification system

## Risks & Mitigation

### Technical Risks
- **Document verification bottleneck**: Implement automated OCR
- **Storage costs for documents**: Compress and optimize files
- **Background check API limits**: Implement queue system

### Business Risks
- **Admin approval delays**: Create automated approval rules
- **Driver onboarding friction**: Streamline registration process
- **Security compliance**: Regular security audits

## Success Metrics

### Performance KPIs
- Registration completion rate > 80%
- Average approval time < 24 hours
- Document upload success rate > 95%
- Zero security incidents

### Business KPIs
- Driver onboarding time < 48 hours
- Admin approval efficiency > 90%
- Document verification accuracy > 98%
- Driver activation rate after approval > 85%
