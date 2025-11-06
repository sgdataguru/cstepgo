# User Story: Epic D.1 - Driver Sign-In (Admin-Provisioned)

**Epic:** D — Driver Portal

**As a** driver,
**I want** to sign into my driver portal with admin-provisioned credentials,
**so that** I can manage my trips and bookings.

## Acceptance Criteria

### Driver Provisioning (Admin Action)
* Admin creates driver account (Story E.2)
* Driver receives credentials via email/SMS:
  - Username: Phone number or email
  - Temporary password
  - Link to driver portal: `[domain]/driver`
  - Instructions: "Change password on first login"

### Driver Sign-In Page
* URL: `/driver` or `/driver/login`
* Form fields:
  - Phone/Email
  - Password
  - "Remember me" checkbox (optional)
* CTA: "Sign In"
* Link: "Forgot password?" → Password reset flow (G2)

### Authentication
* Password validation:
  - Min 8 characters
  - Must include: uppercase, lowercase, number
* First login:
  - Force password change modal
  - New password requirements displayed
  - Confirmation: "Password updated successfully"
* Session management:
  - JWT token with 24-hour expiry
  - Role check: `user.role = 'driver'`
  - Cookie: `driver_session`

### Portal Redirect
* Successful login → `/driver/dashboard`
* Failed login:
  - Display error: "Invalid credentials"
  - 5 failed attempts → 15-minute account lockout
  - Lockout message: "Too many attempts. Try again in 15 minutes."

### Role-Based Access Control
* Middleware check on all `/driver/*` routes:
  - Verify JWT token
  - Verify `user.role = 'driver'`
  - Unauthorized users → Redirect to `/driver/login`
* Non-driver users attempting access:
  - Display: "Access denied. Driver credentials required."

## Technical Notes

### Database Schema
* `users` table:
  ```sql
  role: 'driver' (set by admin)
  password_hash: VARCHAR (bcrypt)
  password_changed_at: TIMESTAMP
  failed_login_attempts: INT
  lockout_until: TIMESTAMP
  ```

### Password Security
* Hashing: bcrypt with salt rounds = 10
* No plaintext passwords stored
* Password reset via OTP (similar to B.1)

### Session Management
* JWT payload:
  ```json
  {
    "user_id": "uuid",
    "role": "driver",
    "driver_id": "uuid",
    "exp": 1234567890
  }
  ```

### PostHog Events
* `driver_login_success`
* `driver_login_failed` (reason: invalid_credentials / locked_out)
* `driver_password_changed`

### Edge Cases
* Driver deleted by admin → Session invalidated, redirect to login with message
* Concurrent logins → Allow (same driver, multiple devices)
* Session expiry during active use → Graceful redirect with toast

## Access Control Matrix
| Role | `/driver/dashboard` | `/driver/bookings` | `/admin/*` |
|------|---------------------|--------------------|-----------| 
| Driver | ✅ | ✅ | ❌ |
| Traveler | ❌ | ❌ | ❌ |
| Admin | ✅ (view-only) | ✅ (view-only) | ✅ |

## Success Metrics
* Driver login success rate: >98%
* Avg login time: <10 seconds
* Lockout incidents: <1% of drivers

## Gate Assignment
**Gate 2** (Basic driver authentication)
**Gate 3** (OAuth/SSO, biometric login for mobile app)
