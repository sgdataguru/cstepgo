# 11 Manage Trip Settings - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a platform administrator, I want to configure trip-related settings through an admin panel, so that I can control platform behavior without code changes.

## Pre-conditions

- Admin user is authenticated with 'admin' or 'super_admin' role
- Admin has 'trip_settings_management' permission
- Settings infrastructure exists in the database
- Redis cache layer is configured for real-time updates

## Business Requirements

- Reduce configuration deployment time by 95% (from hours to seconds)
- Enable dynamic platform behavior adjustments without engineering involvement
- Maintain audit trail for all configuration changes for compliance
- Support A/B testing through configuration toggles

## Technical Specifications

### Integration Points
- **Authentication**: Clerk/Supabase Auth with admin role verification
- **Settings API**: `/api/admin/settings/trips` for CRUD operations
- **Cache Service**: Redis pub/sub for real-time setting propagation
- **Audit Service**: `/api/admin/audit-logs` for change tracking
- **Image Storage**: S3/Cloudinary for hero image management

### Security Requirements
- Admin-only access with role-based permissions
- All changes require authentication verification
- Audit log retention for 365 days minimum
- IP whitelist for production admin access
- Rate limiting on settings updates (10 per minute)

## Design Specifications

### Visual Layout & Components

**Admin Panel Layout Structure**:
```
[Admin Dashboard]
├── [Sidebar Navigation]
│   ├── [Dashboard]
│   ├── [Trip Settings] <- Active
│   ├── [User Management]
│   └── [Reports]
├── [Main Content Area]
│   ├── [Page Header]
│   │   ├── [Title: "Trip Settings"]
│   │   ├── [Last Updated Info]
│   │   └── [Save Changes Button]
│   └── [Settings Sections]
│       ├── [Auto-Publishing Settings]
│       ├── [Route Hero Images]
│       ├── [Pricing Coefficients]
│       └── [Country Restrictions]
└── [Activity Feed Sidebar]
    └── [Recent Changes Log]
```

**Settings Section Components**:
```
[Settings Card]
├── [Section Header]
│   ├── [Icon]
│   ├── [Title]
│   └── [Description]
├── [Settings Content]
│   └── [Specific Controls]
└── [Section Footer]
    ├── [Last Modified]
    └── [Modified By]
```

### Design System Compliance

**Color Palette**:
```css
/* Admin Theme Colors */
--admin-primary: #1e40af;        /* Blue-800 */
--admin-secondary: #7c3aed;      /* Violet-600 */
--admin-success: #059669;        /* Emerald-600 */
--admin-warning: #d97706;        /* Amber-600 */
--admin-danger: #dc2626;         /* Red-600 */

/* Background Colors */
--admin-bg: #f9fafb;             /* Gray-50 */
--admin-card-bg: #ffffff;        /* White */
--admin-sidebar-bg: #111827;     /* Gray-900 */

/* Status Colors */
--status-active: #10b981;        /* Emerald-500 */
--status-inactive: #6b7280;      /* Gray-500 */
--status-pending: #f59e0b;       /* Amber-500 */
```

**Typography Scale**:
```css
/* Headers */
--admin-h1: 1.875rem;            /* 30px */
--admin-h2: 1.5rem;              /* 24px */
--admin-h3: 1.25rem;             /* 20px */

/* Body Text */
--admin-body: 0.875rem;          /* 14px */
--admin-small: 0.75rem;          /* 12px */

/* Form Elements */
--input-label: 0.875rem;         /* 14px */
--input-text: 0.875rem;          /* 14px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.admin-layout {
  @apply flex flex-col;
}

.settings-grid {
  @apply grid grid-cols-1 gap-4;
}

.sidebar {
  @apply hidden;
}
```

**Desktop (768px+)**:
```css
.admin-layout {
  @apply grid grid-cols-12 gap-6;
}

.sidebar {
  @apply col-span-2;
}

.main-content {
  @apply col-span-8;
}

.activity-feed {
  @apply col-span-2;
}
```

### Interaction Patterns

**Toggle States**:
```typescript
interface ToggleStates {
  enabled: {
    bg: 'bg-emerald-500',
    translate: 'translate-x-5',
    label: 'Enabled'
  };
  disabled: {
    bg: 'bg-gray-300',
    translate: 'translate-x-0',
    label: 'Disabled'
  };
  loading: {
    bg: 'bg-gray-400',
    opacity: 'opacity-50',
    cursor: 'cursor-wait'
  };
}
```

**Save States**:
```typescript
interface SaveStates {
  idle: {
    text: 'Save Changes',
    disabled: false,
    icon: null
  };
  saving: {
    text: 'Saving...',
    disabled: true,
    icon: 'spinner'
  };
  saved: {
    text: 'Saved',
    disabled: false,
    icon: 'check'
  };
  error: {
    text: 'Save Failed',
    disabled: false,
    icon: 'x-mark'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/admin/
├── trip-settings/
│   ├── page.tsx                     # Settings page
│   ├── layout.tsx                   # Admin layout
│   └── components/
│       ├── SettingsContainer.tsx    # Main container
│       ├── AutoPublishSection.tsx   # Auto-publish settings
│       ├── RouteImageSection.tsx    # Route hero images
│       ├── PricingSection.tsx       # Pricing coefficients
│       ├── CountrySection.tsx       # Country restrictions
│       ├── AuditLog.tsx            # Change history
│       └── hooks/
│           ├── useSettings.ts       # Settings management
│           ├── useAuditLog.ts      # Audit tracking
│           └── useSaveSettings.ts   # Save functionality
└── components/
    ├── AdminSidebar.tsx            # Shared sidebar
    ├── AdminHeader.tsx             # Shared header
    └── ActivityFeed.tsx            # Activity sidebar
```

### State Management Architecture

**Settings State Interface**:
```typescript
interface TripSettingsState {
  // Settings Data
  autoPublishing: AutoPublishingSettings;
  routeImages: RouteImageMapping[];
  pricingCoefficients: PricingCoefficients;
  countryRestrictions: CountryRestrictions;
  
  // Metadata
  lastUpdated: Date;
  lastUpdatedBy: AdminUser;
  
  // UI State
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
  saveStatus: SaveStatus;
  
  // Audit
  recentChanges: AuditLogEntry[];
}

interface AutoPublishingSettings {
  enabled: boolean;
  publishDelay: number; // minutes
  requiresApproval: boolean;
  approvalRoles: string[];
}

interface RouteImageMapping {
  id: string;
  routePattern: string; // e.g., "almaty-astana"
  imageUrl: string;
  thumbnailUrl: string;
  alt: string;
  isActive: boolean;
}

interface PricingCoefficients {
  basePrice: number;
  perKmRate: number;
  perHourRate: number;
  platformFee: number; // percentage
  peakHourMultiplier: number;
  minimumPrice: number;
}

interface CountryRestrictions {
  allowedCountries: string[]; // ISO codes
  defaultCountry: string;
  restrictionLevel: 'strict' | 'moderate' | 'open';
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: AdminUser;
  action: 'create' | 'update' | 'delete';
  section: string;
  previousValue: any;
  newValue: any;
}
```

### API Integration Schema

**Settings Management APIs**:
```typescript
// Get Settings
interface GetSettingsRequest {
  section?: 'all' | 'auto-publish' | 'routes' | 'pricing' | 'countries';
}

interface GetSettingsResponse {
  settings: TripSettingsState;
  permissions: {
    canEdit: boolean;
    canViewAudit: boolean;
  };
}

// Update Settings
interface UpdateSettingsRequest {
  section: string;
  data: Partial<TripSettingsState>;
  reason?: string; // For audit log
}

interface UpdateSettingsResponse {
  success: boolean;
  settings: TripSettingsState;
  validationErrors?: Record<string, string>;
  auditLogId: string;
}

// Route Image Upload
interface UploadRouteImageRequest {
  routePattern: string;
  image: File;
  alt: string;
}

interface UploadRouteImageResponse {
  imageUrl: string;
  thumbnailUrl: string;
  id: string;
}

// Audit Log
interface GetAuditLogRequest {
  section?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface AuditLogResponse {
  entries: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}
```

## Implementation Requirements

### Core Components

**SettingsContainer.tsx** - Main settings orchestration
```typescript
interface SettingsContainerProps {
  initialSettings: TripSettingsState;
  permissions: AdminPermissions;
}
```

**AutoPublishSection.tsx** - Auto-publishing configuration
```typescript
interface AutoPublishSectionProps {
  settings: AutoPublishingSettings;
  onChange: (settings: AutoPublishingSettings) => void;
  disabled?: boolean;
}
```

**RouteImageSection.tsx** - Route to image mapping
```typescript
interface RouteImageSectionProps {
  mappings: RouteImageMapping[];
  onAdd: (mapping: RouteImageMapping) => void;
  onUpdate: (id: string, mapping: Partial<RouteImageMapping>) => void;
  onDelete: (id: string) => void;
}
```

**PricingSection.tsx** - Pricing coefficient management
```typescript
interface PricingSectionProps {
  coefficients: PricingCoefficients;
  onChange: (coefficients: PricingCoefficients) => void;
  validationErrors?: Record<string, string>;
}
```

**CountrySection.tsx** - Country restriction settings
```typescript
interface CountrySectionProps {
  restrictions: CountryRestrictions;
  onChange: (restrictions: CountryRestrictions) => void;
  availableCountries: Country[];
}
```

### Custom Hooks

**useSettings()** - Main settings management
```typescript
function useSettings(): {
  settings: TripSettingsState;
  updateSection: (section: string, data: any) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  isDirty: boolean;
  isSaving: boolean;
}
```

**useAuditLog()** - Audit log tracking
```typescript
function useAuditLog(section?: string): {
  entries: AuditLogEntry[];
  isLoading: boolean;
  loadMore: () => void;
  hasMore: boolean;
}
```

**useSaveSettings()** - Auto-save and manual save
```typescript
function useSaveSettings(settings: TripSettingsState): {
  save: () => Promise<void>;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  lastSaved: Date | null;
  saveStatus: SaveStatus;
}
```

### Utility Functions

**settings-validators.ts** - Validation rules
```typescript
function validatePricingCoefficients(coefficients: PricingCoefficients): ValidationResult
function validateRoutePattern(pattern: string): boolean
function validateImageUrl(url: string): boolean
function validateCountryCode(code: string): boolean
```

**settings-formatters.ts** - Display formatting
```typescript
function formatCurrency(amount: number): string
function formatPercentage(value: number): string
function formatRoutePattern(pattern: string): string
function formatAuditEntry(entry: AuditLogEntry): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Admin can toggle auto-publishing of trips
- ✓ Route to hero image mapping interface functional
- ✓ Pricing coefficient update table with validation
- ✓ Country restriction list for autocomplete configurable
- ✓ Changes take effect immediately across platform
- ✓ All settings have appropriate validation
- ✓ Complete audit log of all setting changes
- ✓ Role-based access control enforced

**Data Management**
- ✓ Settings persisted to database
- ✓ Redis cache updated on changes
- ✓ Real-time propagation to all services
- ✓ Rollback capability for critical settings

**User Interface**
- ✓ Intuitive admin interface
- ✓ Clear feedback on save status
- ✓ Validation errors displayed inline
- ✓ Activity feed shows recent changes

### Non-Functional Requirements

**Performance**
- Settings load < 1 second
- Save operation < 2 seconds
- Real-time update < 500ms
- Audit log query < 1 second

**Accessibility**
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators visible

**Security**
- Admin authentication required
- Permission checks on all actions
- Audit trail immutable
- Sensitive data masked in logs

## Modified Files
```
src/
├── app/
│   └── admin/
│       └── trip-settings/
│           ├── page.tsx ⬜
│           ├── layout.tsx ⬜
│           └── components/
│               ├── SettingsContainer.tsx ⬜
│               ├── AutoPublishSection.tsx ⬜
│               ├── RouteImageSection.tsx ⬜
│               ├── PricingSection.tsx ⬜
│               ├── CountrySection.tsx ⬜
│               ├── AuditLog.tsx ⬜
│               └── hooks/
│                   ├── useSettings.ts ⬜
│                   ├── useAuditLog.ts ⬜
│                   └── useSaveSettings.ts ⬜
├── lib/
│   ├── admin/
│   │   ├── settings-service.ts ⬜
│   │   └── audit-service.ts ⬜
│   └── utils/
│       ├── settings-validators.ts ⬜
│       └── settings-formatters.ts ⬜
├── types/
│   └── admin-types.ts ⬜
└── constants/
    └── admin-permissions.ts ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create admin route structure
- [ ] Set up authentication guards
- [ ] Define TypeScript interfaces
- [ ] Create base layout components

### Phase 2: Core Implementation
- [ ] Build settings sections
- [ ] Implement validation logic
- [ ] Create save functionality
- [ ] Add Redis cache updates

### Phase 3: Enhanced Features
- [ ] Image upload for routes
- [ ] Audit log display
- [ ] Real-time updates
- [ ] Bulk operations support

### Phase 4: Polish & Testing
- [ ] Error handling refinement
- [ ] Performance optimization
- [ ] Security audit
- [ ] End-to-end testing

## Dependencies

### Internal Dependencies
- Authentication service with RBAC
- Redis pub/sub for real-time updates
- Image storage service
- Audit logging service

### External Dependencies
- Image optimization service
- Country code validation library
- Currency formatting library
- Date formatting utilities

## Risk Assessment

### Technical Risks

**Cache Invalidation Complexity**
- Impact: High
- Mitigation: Implement cache versioning
- Contingency: Manual cache clear option

**Real-time Update Failures**
- Impact: Medium
- Mitigation: Fallback polling mechanism
- Contingency: Manual refresh button

**Data Validation Errors**
- Impact: Medium
- Mitigation: Comprehensive validation
- Contingency: Rollback functionality

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Trip Settings Admin', () => {
  it('should validate pricing coefficients correctly', () => {});
  it('should handle image upload failures', () => {});
  it('should enforce permission requirements', () => {});
  it('should create audit log entries', () => {});
});

describe('useSettings Hook', () => {
  it('should track dirty state correctly', () => {});
  it('should handle concurrent updates', () => {});
  it('should validate before saving', () => {});
});
```

### Integration Tests
```typescript
describe('Settings Integration', () => {
  it('should save and propagate settings', async () => {});
  it('should update cache on changes', async () => {});
  it('should enforce access control', async () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load admin components
- Code split image upload
- Optimize audit log rendering

### Runtime Performance
- Debounce validation calls
- Virtualize long lists
- Implement pagination

### Caching Strategy
- Cache settings (5 minutes)
- Cache audit logs (10 minutes)
- Invalidate on updates

## Deployment Plan

### Development Phase
- Mock admin authentication
- Test with sample data
- Validate permission model

### Staging Phase
- Full integration testing
- Performance benchmarking
- Security penetration testing

### Production Phase
- Gradual rollout to admins
- Monitor save success rate
- Track setting usage

## Monitoring & Analytics

### Performance Metrics
- Page load times
- Save operation duration
- Cache hit rates

### Business Metrics
- Setting change frequency
- Most modified settings
- Admin engagement

### Technical Metrics
- API response times
- Error rates
- Audit log growth

## Documentation Requirements

### Technical Documentation
- Admin API documentation
- Permission matrix
- Cache invalidation guide

### User Documentation
- Admin user guide
- Setting descriptions
- Best practices guide

## Post-Launch Review

### Success Criteria
- 95% reduction in deployment time
- Zero configuration errors
- 100% audit trail coverage
- Positive admin feedback

### Retrospective Items
- UI/UX improvements needed
- Additional settings requested
- Performance bottlenecks