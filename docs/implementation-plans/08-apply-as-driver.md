# 08 Apply as Driver - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a potential driver, I want to apply through a structured onboarding process, so that I can become verified and start offering trips on the platform.

## Pre-conditions

- User authentication system exists
- Document storage infrastructure (S3/similar) configured
- Admin verification workflow exists
- Email/SMS notification services active

## Business Requirements

- Increase driver acquisition rate by 50%
- Reduce verification turnaround time to < 48 hours
- Achieve 90% application completion rate
- Ensure 100% compliance with regulatory requirements

## Technical Specifications

### Integration Points
- **Document Storage**: AWS S3 or Supabase Storage for documents
- **Background Check**: Checkr/Sterling API integration
- **OCR Service**: Google Vision API for document parsing
- **Verification Queue**: Redis/BullMQ for processing
- **Notifications**: Email (Postmark) + SMS (Twilio)

### Security Requirements
- End-to-end encryption for sensitive documents
- PII data handling compliance (GDPR/local laws)
- Secure document URLs with expiration
- Audit trail for all verification steps
- Role-based access for admin reviewers

## Design Specifications

### Visual Layout & Components

**Application Flow Structure**:
```
[Driver Application Container]
├── [Progress Header]
│   ├── [Step Indicators]
│   ├── [Current Step Title]
│   └── [Save & Exit Button]
├── [Step 1: Personal Information]
│   ├── [Basic Info Form]
│   ├── [Contact Details]
│   └── [Address Verification]
├── [Step 2: Document Upload]
│   ├── [License Upload]
│   ├── [Insurance Upload]
│   ├── [Vehicle Registration]
│   └── [Identity Verification]
├── [Step 3: Vehicle Information]
│   ├── [Vehicle Details Form]
│   ├── [Vehicle Photos]
│   └── [Amenities Selection]
├── [Step 4: Background Check]
│   ├── [Consent Form]
│   ├── [Background Check Status]
│   └── [Additional Documents]
├── [Step 5: Training & Onboarding]
│   ├── [Training Modules]
│   ├── [Quiz/Assessment]
│   └── [Platform Guidelines]
└── [Step 6: Final Review]
    ├── [Application Summary]
    ├── [Terms Acceptance]
    └── [Submit for Approval]
```

**Progress Indicator Design**:
```
[Progress Bar]
├── [Completed Steps] (Green checkmarks)
├── [Current Step] (Blue pulse animation)
├── [Upcoming Steps] (Gray indicators)
└── [Step Labels] (Responsive text)
```

### Design System Compliance

**Color Palette**:
```css
/* Application Flow Colors */
--app-primary: #3b82f6;          /* Blue-500 */
--app-success: #10b981;          /* Emerald-500 */
--app-warning: #f59e0b;          /* Amber-500 */
--app-error: #ef4444;            /* Red-500 */
--app-pending: #8b5cf6;          /* Violet-500 */

/* Progress States */
--progress-complete: #10b981;     /* Emerald-500 */
--progress-active: #3b82f6;       /* Blue-500 */
--progress-inactive: #e5e7eb;     /* Gray-200 */

/* Document Upload States */
--upload-ready: #dbeafe;         /* Blue-100 */
--upload-progress: #fbbf24;      /* Amber-400 */
--upload-complete: #d1fae5;      /* Emerald-100 */
--upload-error: #fee2e2;         /* Red-100 */
```

**Typography Scale**:
```css
/* Headers */
--step-title: 1.5rem;            /* 24px */
--section-header: 1.25rem;       /* 20px */

/* Form Elements */
--form-label: 0.875rem;          /* 14px */
--form-input: 1rem;              /* 16px */
--helper-text: 0.75rem;          /* 12px */

/* Progress Text */
--progress-label: 0.875rem;      /* 14px */
--progress-counter: 0.75rem;     /* 12px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.application-container {
  @apply w-full px-4 py-6;
}

.progress-bar {
  @apply flex overflow-x-auto;
}

.document-grid {
  @apply grid grid-cols-1 gap-4;
}
```

**Desktop (768px+)**:
```css
.application-container {
  @apply max-w-4xl mx-auto px-8 py-12;
}

.progress-bar {
  @apply flex justify-between;
}

.document-grid {
  @apply grid grid-cols-2 gap-6;
}
```

### Interaction Patterns

**Document Upload States**:
```typescript
interface UploadStates {
  idle: {
    border: 'border-dashed border-gray-300',
    bg: 'bg-gray-50',
    cursor: 'cursor-pointer'
  };
  dragOver: {
    border: 'border-solid border-blue-500',
    bg: 'bg-blue-50',
    transform: 'scale(1.02)'
  };
  uploading: {
    border: 'border-solid border-amber-500',
    bg: 'bg-amber-50',
    cursor: 'cursor-wait'
  };
  complete: {
    border: 'border-solid border-green-500',
    bg: 'bg-green-50',
    icon: 'checkmark'
  };
  error: {
    border: 'border-solid border-red-500',
    bg: 'bg-red-50',
    shake: 'animate-shake'
  };
}
```

**Step Transitions**:
```typescript
interface StepTransitions {
  entering: {
    opacity: 0,
    transform: 'translateX(50px)'
  };
  entered: {
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'all 400ms ease-out'
  };
  exiting: {
    opacity: 0,
    transform: 'translateX(-50px)'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/driver/
├── apply/
│   ├── page.tsx                     # Application entry point
│   ├── layout.tsx                   # Application layout
│   └── components/
│       ├── ApplicationFlow.tsx      # Main container
│       ├── ProgressIndicator.tsx    # Progress tracking
│       ├── steps/
│       │   ├── PersonalInfoStep.tsx
│       │   ├── DocumentUploadStep.tsx
│       │   ├── VehicleInfoStep.tsx
│       │   ├── BackgroundCheckStep.tsx
│       │   ├── TrainingStep.tsx
│       │   └── ReviewStep.tsx
│       ├── forms/
│       │   ├── PersonalInfoForm.tsx
│       │   ├── VehicleForm.tsx
│       │   └── ConsentForm.tsx
│       ├── uploads/
│       │   ├── DocumentUploader.tsx
│       │   ├── ImageUploader.tsx
│       │   └── FilePreview.tsx
│       └── hooks/
│           ├── useApplication.ts
│           ├── useDocumentUpload.ts
│           └── useVerification.ts
└── dashboard/
    └── application-status/
        └── page.tsx                 # Status tracking
```

### State Management Architecture

**Application State Interface**:
```typescript
interface DriverApplicationState {
  // Application Data
  applicationId: string | null;
  currentStep: ApplicationStep;
  completedSteps: Set<ApplicationStep>;
  
  // Form Data
  personalInfo: PersonalInfo;
  documents: DocumentsState;
  vehicleInfo: VehicleInfo;
  backgroundCheck: BackgroundCheckState;
  training: TrainingState;
  
  // Upload States
  uploads: Record<DocumentType, UploadState>;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string[]>;
  lastSaved: Date | null;
  
  // Verification State
  verificationStatus: VerificationStatus;
  rejectionReasons: string[];
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationalId: string;
  phone: string;
  email: string;
  address: Address;
  emergencyContact: EmergencyContact;
}

interface DocumentsState {
  driverLicense: Document | null;
  insurance: Document | null;
  vehicleRegistration: Document | null;
  identityProof: Document | null;
  additionalDocs: Document[];
}

interface Document {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  capacity: number;
  vehicleType: VehicleType;
  amenities: string[];
  photos: VehiclePhoto[];
}

type ApplicationStep = 
  | 'personal-info'
  | 'documents'
  | 'vehicle'
  | 'background-check'
  | 'training'
  | 'review';

type VerificationStatus = 
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'additional-info-required'
  | 'approved'
  | 'rejected';
```

### API Integration Schema

**Application Management APIs**:
```typescript
// Create/Update Application
interface SaveApplicationRequest {
  applicationId?: string;
  step: ApplicationStep;
  data: Partial<DriverApplicationData>;
  action: 'save-draft' | 'save-continue' | 'submit';
}

interface SaveApplicationResponse {
  applicationId: string;
  currentStep: ApplicationStep;
  completedSteps: ApplicationStep[];
  lastSaved: string; // ISO date
  validationErrors?: Record<string, string[]>;
}

// Document Upload
interface DocumentUploadRequest {
  applicationId: string;
  documentType: DocumentType;
  file: File;
  metadata?: {
    expiryDate?: string;
    documentNumber?: string;
  };
}

interface DocumentUploadResponse {
  documentId: string;
  url: string;
  processingStatus: 'processing' | 'complete' | 'failed';
  extractedData?: {
    // OCR results
    name?: string;
    number?: string;
    expiryDate?: string;
  };
}

// Background Check
interface InitiateBackgroundCheckRequest {
  applicationId: string;
  consent: boolean;
  ssn?: string; // Encrypted
}

interface BackgroundCheckResponse {
  checkId: string;
  status: 'initiated' | 'processing' | 'complete' | 'failed';
  estimatedCompletion: string; // ISO date
  results?: {
    criminalRecord: 'clear' | 'review-required';
    drivingRecord: 'clear' | 'violations-found';
    identityVerification: 'verified' | 'not-verified';
  };
}

// Submit Application
interface SubmitApplicationRequest {
  applicationId: string;
  termsAccepted: boolean;
  signature: string; // Base64
}

interface SubmitApplicationResponse {
  success: boolean;
  verificationStatus: VerificationStatus;
  estimatedReviewTime: string;
  nextSteps: string[];
}
```

## Implementation Requirements

### Core Components

**ApplicationFlow.tsx** - Main application container
```typescript
interface ApplicationFlowProps {
  applicationId?: string;
  onComplete: () => void;
  onExit: () => void;
}
```

**DocumentUploader.tsx** - Secure document upload
```typescript
interface DocumentUploaderProps {
  documentType: DocumentType;
  onUpload: (document: Document) => void;
  existingDocument?: Document;
  requirements: DocumentRequirements;
}
```

**VehicleForm.tsx** - Vehicle information collection
```typescript
interface VehicleFormProps {
  initialData?: VehicleInfo;
  onSubmit: (data: VehicleInfo) => void;
  vehicleTypes: VehicleType[];
}
```

**TrainingStep.tsx** - Onboarding modules
```typescript
interface TrainingStepProps {
  modules: TrainingModule[];
  onComplete: (results: TrainingResults) => void;
  progress: TrainingProgress;
}
```

### Custom Hooks

**useApplication()** - Main application state management
```typescript
function useApplication(applicationId?: string): {
  application: DriverApplicationState;
  actions: {
    saveProgress: (step: ApplicationStep, data: any) => Promise<void>;
    uploadDocument: (type: DocumentType, file: File) => Promise<void>;
    submitApplication: () => Promise<void>;
    goToStep: (step: ApplicationStep) => void;
  };
  validation: {
    validateStep: (step: ApplicationStep) => ValidationResult;
    canProceed: boolean;
  };
}
```

**useDocumentUpload()** - Document upload handling
```typescript
function useDocumentUpload(): {
  upload: (file: File, type: DocumentType) => Promise<Document>;
  uploadProgress: Record<string, number>;
  isUploading: boolean;
  error: Error | null;
}
```

**useVerification()** - Verification status tracking
```typescript
function useVerification(applicationId: string): {
  status: VerificationStatus;
  updates: VerificationUpdate[];
  refreshStatus: () => Promise<void>;
  subscribeToUpdates: () => () => void;
}
```

### Utility Functions

**document-validators.ts** - Document validation
```typescript
function validateDocument(file: File, type: DocumentType): ValidationResult
function checkDocumentExpiry(document: Document): boolean
function validateFileSize(file: File): boolean
function validateFileType(file: File, allowedTypes: string[]): boolean
```

**application-helpers.ts** - Application utilities
```typescript
function calculateProgress(state: DriverApplicationState): number
function getNextStep(currentStep: ApplicationStep): ApplicationStep | null
function canSkipStep(step: ApplicationStep): boolean
function formatApplicationStatus(status: VerificationStatus): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Multi-step application with 6 defined steps
- ✓ Progress indicator shows completion status
- ✓ Auto-save functionality every 30 seconds
- ✓ Resume application from any step
- ✓ Clear document requirements displayed
- ✓ Real-time verification status updates
- ✓ Email/SMS notifications for status changes

**Data Management**
- ✓ Secure document storage with encryption
- ✓ OCR extraction for document data
- ✓ Background check integration working
- ✓ Application versioning for audits

**User Interface**
- ✓ Mobile-responsive application flow
- ✓ Drag-and-drop document upload
- ✓ Progress persistence across sessions
- ✓ Clear error messaging and recovery

### Non-Functional Requirements

**Performance**
- Page load < 2 seconds
- Document upload < 10MB in 30 seconds
- Auto-save latency < 500ms
- OCR processing < 5 seconds

**Accessibility**
- Keyboard navigation throughout
- Screen reader compatibility
- High contrast mode support
- Clear focus indicators

**Security**
- End-to-end encryption for documents
- Secure file storage with access control
- PII data masking in logs
- Session timeout after 30 minutes

## Modified Files
```
src/
├── app/
│   └── driver/
│       ├── apply/
│       │   ├── page.tsx ⬜
│       │   ├── layout.tsx ⬜
│       │   └── components/
│       │       ├── ApplicationFlow.tsx ⬜
│       │       ├── ProgressIndicator.tsx ⬜
│       │       ├── steps/ (6 files) ⬜
│       │       ├── forms/ (3 files) ⬜
│       │       ├── uploads/ (3 files) ⬜
│       │       └── hooks/ (3 files) ⬜
│       └── dashboard/
│           └── application-status/
│               └── page.tsx ⬜
├── lib/
│   ├── driver/
│   │   ├── application-service.ts ⬜
│   │   └── verification-service.ts ⬜
│   └── utils/
│       ├── document-validators.ts ⬜
│       └── application-helpers.ts ⬜
├── types/
│   └── driver-application-types.ts ⬜
└── constants/
    └── driver-requirements.ts ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create application page structure
- [ ] Define TypeScript interfaces
- [ ] Set up progress tracking
- [ ] Configure document storage

### Phase 2: Core Implementation
- [ ] Build personal info step
- [ ] Implement document upload
- [ ] Create vehicle info form
- [ ] Add background check consent

### Phase 3: Enhanced Features
- [ ] OCR integration for documents
- [ ] Real-time status updates
- [ ] Training module system
- [ ] Admin review interface

### Phase 4: Polish & Testing
- [ ] Error handling and recovery
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- Authentication service
- File storage service
- Notification service
- Admin panel integration

### External Dependencies
- AWS S3 or Supabase Storage
- Google Vision API (OCR)
- Checkr/Sterling (Background checks)
- Twilio (SMS notifications)

## Risk Assessment

### Technical Risks

**Document Processing Failures**
- Impact: High
- Mitigation: Retry logic, manual review option
- Contingency: Admin override capability

**Background Check API Issues**
- Impact: High
- Mitigation: Multiple provider support
- Contingency: Manual verification process

**Large File Uploads**
- Impact: Medium
- Mitigation: Chunked uploads, compression
- Contingency: Offline submission option

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Driver Application Flow', () => {
  it('should save progress between steps', async () => {});
  it('should validate documents correctly', () => {});
  it('should handle upload failures gracefully', () => {});
  it('should enforce step completion rules', () => {});
});

describe('useApplication Hook', () => {
  it('should manage application state correctly', () => {});
  it('should handle concurrent saves', async () => {});
  it('should validate step data before proceeding', () => {});
});
```

### Integration Tests
```typescript
describe('Application Submission', () => {
  it('should complete full application flow', async () => {});
  it('should resume incomplete applications', async () => {});
  it('should trigger verification workflow', async () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Code split each step component
- Lazy load document preview
- Optimize image uploads

### Runtime Performance
- Virtualize long document lists
- Debounce auto-save calls
- Progressive image loading

### Caching Strategy
- Cache application progress locally
- Store uploaded documents temporarily
- Cache validation results

## Deployment Plan

### Development Phase
- Mock external services
- Test with various document types
- Simulate verification workflows

### Staging Phase
- Real service integration
- Load test document uploads
- Security penetration testing

### Production Phase
- Phased rollout by region
- Monitor verification times
- Track completion rates

## Monitoring & Analytics

### Performance Metrics
- Application completion time
- Step abandonment rates
- Document upload success rate

### Business Metrics
- Driver acquisition rate
- Verification approval rate
- Time to first trip

### Technical Metrics
- API response times
- Upload failure rates
- Background check latency

## Documentation Requirements

### Technical Documentation
- API integration guides
- Document requirements spec
- Verification workflow diagram

### User Documentation
- Step-by-step application guide
- Document preparation checklist
- FAQ section

## Post-Launch Review

### Success Criteria
- 50% increase in driver applications
- 90% completion rate achieved
- < 48 hour verification time
- 95% document upload success rate

### Retrospective Items
- User feedback on application flow
- Verification bottleneck analysis
- Technical debt assessment
-