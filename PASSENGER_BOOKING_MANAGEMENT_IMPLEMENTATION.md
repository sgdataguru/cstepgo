# Passenger Booking Management (UC-36) Implementation

## Overview

This document describes the implementation of **UC-36: Passenger Manage Upcoming Bookings**, which provides passengers with a comprehensive interface to view, manage, and cancel their bookings for both private trips and shared rides.

## Feature Summary

The Passenger Booking Management system allows passengers to:

1. **View All Bookings**: List all bookings (upcoming, past, or all) with complete trip information
2. **View Booking Details**: Access detailed information about each booking including driver info, payment details, and trip specifics
3. **Cancel Bookings**: Cancel eligible bookings with proper validation and real-time driver notifications
4. **Track Status**: Monitor booking status, payment status, and driver assignment
5. **Differentiate Trip Types**: Easily distinguish between private cab rides and shared rides

## Implementation Details

### 1. Backend APIs

#### 1.1 List Bookings API

**Endpoint**: `GET /api/passengers/bookings`

**Query Parameters**:
- `upcoming` (boolean): Filter for upcoming trips
- `past` (boolean): Filter for past trips
- `status` (string): Filter by booking status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `stats` (boolean): Get booking statistics instead of list

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_id",
      "tripId": "trip_id",
      "status": "CONFIRMED",
      "seatsBooked": 2,
      "totalAmount": 15000,
      "currency": "KZT",
      "paymentMethodType": "ONLINE",
      "createdAt": "2025-01-20T10:00:00Z",
      "confirmedAt": "2025-01-20T10:05:00Z",
      "cancelledAt": null,
      "trip": {
        "title": "Almaty to Shymbulak",
        "originName": "Almaty City Center",
        "destName": "Shymbulak Ski Resort",
        "departureTime": "2025-01-25T09:00:00Z",
        "status": "CONFIRMED",
        "driverId": "driver_id",
        "tripType": "SHARED",
        "pricePerSeat": 7500
      },
      "paymentStatus": "SUCCEEDED"
    }
  ],
  "meta": {
    "total": 5,
    "upcomingCount": 2
  }
}
```

**Features**:
- Returns trip type (PRIVATE/SHARED) for each booking
- Includes payment method type (ONLINE/CASH_TO_DRIVER)
- Shows price per seat for shared rides
- Provides payment status from related Payment record
- Supports multiple filtering options

#### 1.2 Get Booking Details API

**Endpoint**: `GET /api/passengers/bookings/{bookingId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "booking_id",
    "status": "CONFIRMED",
    "seatsBooked": 2,
    "totalAmount": 15000,
    "currency": "KZT",
    "paymentMethodType": "ONLINE",
    "passengers": [
      {"name": "John Doe", "age": 30},
      {"name": "Jane Doe", "age": 28}
    ],
    "notes": null,
    "trip": {
      "id": "trip_id",
      "title": "Almaty to Shymbulak",
      "description": "Scenic mountain ride",
      "originName": "Almaty City Center",
      "originAddress": "Abay Avenue, Almaty",
      "destName": "Shymbulak Ski Resort",
      "destAddress": "Shymbulak, Almaty",
      "departureTime": "2025-01-25T09:00:00Z",
      "returnTime": "2025-01-25T18:00:00Z",
      "status": "CONFIRMED",
      "tripType": "SHARED",
      "pricePerSeat": 7500,
      "totalSeats": 4,
      "availableSeats": 2,
      "driver": {
        "id": "driver_id",
        "vehicleType": "SUV",
        "vehicleModel": "Toyota Land Cruiser",
        "vehicleMake": "Toyota",
        "vehicleColor": "White",
        "licensePlate": "ABC 123",
        "rating": 4.8,
        "reviewCount": 150,
        "user": {
          "id": "user_id",
          "name": "Azamat Kuanyshev",
          "phone": "+77012345678",
          "avatar": "https://..."
        }
      }
    },
    "payment": {
      "id": "payment_id",
      "status": "SUCCEEDED",
      "amount": 15000,
      "currency": "KZT",
      "paymentMethod": "card",
      "createdAt": "2025-01-20T10:00:00Z",
      "succeededAt": "2025-01-20T10:01:00Z"
    }
  }
}
```

**Features**:
- Complete trip information including trip type
- Driver details with vehicle information and rating
- Payment information with status and method
- Passenger list
- For shared rides: shows price per seat and seat availability

#### 1.3 Cancel Booking API

**Endpoint**: `POST /api/passengers/bookings/{bookingId}/cancel`

**Request Body**:
```json
{
  "reason": "Plans changed - cannot make it"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "booking_id",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-20T15:30:00Z",
    ...
  }
}
```

**Validation Rules**:
- Cannot cancel if booking is already CANCELLED or COMPLETED
- Cannot cancel if trip departure time has passed
- Cannot cancel within 2 hours of departure time
- Only the booking owner can cancel their booking

**Side Effects**:
- Updates booking status to CANCELLED
- Releases booked seats back to trip availability
- Broadcasts real-time notification to assigned driver
- Records cancellation timestamp and reason

### 2. Backend Service Layer

#### 2.1 Enhanced Booking Service

**File**: `src/lib/services/bookingService.ts`

**Key Functions**:

```typescript
// Get user bookings with trip type and payment info
export async function getUserBookings(
  userId: string,
  filters?: {
    status?: BookingStatus | BookingStatus[];
    upcoming?: boolean;
    past?: boolean;
  }
): Promise<BookingSummary[]>

// Get detailed booking information
export async function getBookingDetails(
  bookingId: string,
  userId: string
): Promise<BookingWithDetails | null>

// Cancel booking with validation
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
): Promise<{
  success: boolean;
  booking?: BookingWithDetails;
  error?: string;
}>

// Check if booking can be cancelled
export function canCancelBooking(
  booking: BookingWithDetails
): {
  canCancel: boolean;
  reason?: string;
}
```

**Enhanced Interfaces**:

```typescript
export interface BookingSummary {
  id: string;
  tripId: string;
  status: BookingStatus;
  seatsBooked: number;
  totalAmount: Prisma.Decimal;
  currency: string;
  paymentMethodType: string; // NEW
  createdAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  trip: {
    title: string;
    originName: string;
    destName: string;
    departureTime: Date;
    status: TripStatus;
    driverId: string | null;
    tripType: string; // NEW
    pricePerSeat: Prisma.Decimal | null; // NEW
  };
  paymentStatus?: string;
}
```

#### 2.2 Real-Time Broadcast Service

**File**: `src/lib/services/realtimeBroadcastService.ts`

**New Function**:

```typescript
async broadcastBookingCancellation(data: {
  bookingId: string;
  tripId: string;
  driverId: string;
  userId: string;
  seatsReleased: number;
  reason: string;
}): Promise<void>
```

**Functionality**:
- Broadcasts cancellation event to assigned driver via WebSocket
- Emits to both driver-specific room (`driver:{driverId}`) and trip room (`trip:{tripId}`)
- Includes seat release information for immediate availability updates
- Gracefully handles cases where Socket.IO is not initialized

### 3. Frontend UI Components

#### 3.1 My Trips List Page

**File**: `src/app/my-trips/page.tsx`

**Features**:
- **Trip Type Badge**: Visual indicator for Private (🚗) vs Shared (👥) rides
  - Blue badge for private trips
  - Purple badge for shared trips
- **Payment Method Badge**: Shows payment type
  - Emerald badge for Online Payment (💳)
  - Amber badge for Cash to Driver (💵)
- **Payment Status Badge**: Shows payment status (SUCCEEDED/PENDING/FAILED)
- **Booking Status Badge**: Color-coded status (CONFIRMED/PENDING/CANCELLED/COMPLETED)
- **Driver Assignment Indicator**: Shows when driver is assigned
- **Seat Information**: Displays number of seats booked
- **Price Per Seat**: For shared rides, shows individual seat price

**Filters**:
- Upcoming: Shows only future bookings
- Past: Shows only historical bookings
- All: Shows all bookings

**Statistics Cards**:
- Total Bookings
- Upcoming Trips
- Completed Trips
- Cancelled Trips

#### 3.2 Booking Details Page

**File**: `src/app/my-trips/[id]/page.tsx`

**Sections**:

1. **Trip Information**
   - Trip title and description
   - Origin and destination with full addresses
   - Departure and return times
   - Seat count
   - Trip type badge (Private/Shared)
   - For shared rides: price per seat and seat availability

2. **Driver Information** (when assigned)
   - Driver name and avatar
   - Rating and review count
   - Phone number
   - Vehicle details (type, make, model, color, license plate)

3. **Booking Summary Sidebar**
   - Booking ID
   - Booking status
   - Booked date
   - Confirmed date (if applicable)
   - Cancelled date (if applicable)
   - Total amount (with breakdown for shared rides)
   - Payment method badge
   - Payment status (if payment exists)
   - Cancel booking button (if eligible)

4. **Cancellation Modal**
   - Confirmation dialog
   - Optional cancellation reason text area
   - Keep/Cancel action buttons
   - Loading state during cancellation

**Enhanced Display**:
- Payment method clearly shown with icon badges
- For shared rides: shows seat-by-seat pricing breakdown
- Trip type prominently displayed
- Contextual warnings (e.g., "Driver Not Yet Assigned")

### 4. Data Flow

#### 4.1 Booking List Flow

```
User → My Trips Page → API Request → Booking Service → Database
                                                           ↓
User ← My Trips Page ← API Response ← Booking Service ← Bookings with Trip & Payment Info
```

#### 4.2 Booking Details Flow

```
User → Booking Details Page → API Request → Booking Service → Database
                                                                  ↓
User ← Booking Details Page ← API Response ← Booking Service ← Full Booking with Driver & Payment
```

#### 4.3 Booking Cancellation Flow

```
User → Cancel Button → Confirmation Modal → API Request → Booking Service
                                                              ↓
                                                         Validation
                                                              ↓
                                                      Transaction Begin
                                                              ↓
                                           Update Booking Status (CANCELLED)
                                                              ↓
                                           Release Seats to Trip
                                                              ↓
                                                      Transaction Commit
                                                              ↓
                                           Broadcast to Driver (WebSocket)
                                                              ↓
User ← Updated UI ← API Response ← Success
```

### 5. Key Features

#### 5.1 Trip Type Differentiation

**Private Trips**:
- Badge: 🚗 Private
- Color: Blue
- Shows total trip price
- Individual trip booking

**Shared Rides**:
- Badge: 👥 Shared
- Color: Purple
- Shows price per seat
- Displays seat availability
- Shows booking breakdown (e.g., "2 seats × 7,500 KZT")

#### 5.2 Payment Method Display

**Online Payment**:
- Badge: 💳 Online Payment
- Color: Emerald
- Integrates with payment gateway
- Auto-confirmed after successful payment

**Cash to Driver**:
- Badge: 💵 Cash to Driver
- Color: Amber
- Payment collected by driver
- Auto-confirmed on booking

#### 5.3 Status Tracking

**Booking Status**:
- PENDING: Awaiting confirmation
- CONFIRMED: Trip confirmed
- CANCELLED: Booking cancelled
- COMPLETED: Trip finished
- REFUNDED: Payment refunded (future)

**Payment Status**:
- PENDING: Payment processing
- SUCCEEDED: Payment successful
- FAILED: Payment failed
- CANCELLED: Payment cancelled

#### 5.4 Cancellation Rules

**Eligible for Cancellation**:
- Booking status is PENDING or CONFIRMED
- Trip departure time is in the future
- At least 2 hours remain before departure

**Not Eligible for Cancellation**:
- Already CANCELLED or COMPLETED
- Trip has started or passed
- Less than 2 hours before departure

### 6. Integration Points

#### 6.1 Private Trip Booking (UC-33)

- Uses `POST /api/bookings` endpoint
- Creates PRIVATE trip type bookings
- Integrates with driver matching system

#### 6.2 Shared Ride Booking (UC-34)

- Uses `POST /api/bookings/shared` endpoint
- Creates SHARED trip type bookings
- Manages seat availability atomically

#### 6.3 Payment Tracking (UC-35)

- Integrates with Payment model
- Shows payment status in UI
- Supports both ONLINE and CASH_TO_DRIVER methods

#### 6.4 Driver Trip Discovery (UC-21)

- Cancellation broadcasts to driver via WebSocket
- Released seats make trip available again
- Driver sees updated availability immediately

### 7. Testing

#### 7.1 Test Script

**File**: `test-passenger-booking-management.sh`

**Test Coverage**:
1. Create test passenger and driver users
2. Create both private and shared bookings
3. List all bookings with filters
4. Get booking details with trip type and payment info
5. Retrieve booking statistics
6. Cancel booking with validation
7. Verify cancellation prevents double-cancellation
8. Test authorization requirements

**Running Tests**:
```bash
# Start the application first
npm run dev

# In another terminal, run tests
./test-passenger-booking-management.sh
```

### 8. Security & Permissions

#### 8.1 Authorization

- All endpoints require authentication via JWT token
- Passengers can only access their own bookings
- Admins have full access to all bookings
- Drivers cannot access passenger booking endpoints

#### 8.2 Data Validation

- Booking ID validation
- User ownership verification
- Cancellation eligibility checks
- Input sanitization for cancellation reasons

#### 8.3 Error Handling

- Graceful handling of missing bookings
- Clear error messages for validation failures
- Fallback for real-time broadcast failures

### 9. Performance Considerations

#### 9.1 Database Queries

- Optimized with proper indexes (userId, status, departureTime)
- Uses selective field inclusion to reduce data transfer
- Transaction support for atomic operations

#### 9.2 Real-Time Updates

- Non-blocking broadcast operations
- Error handling doesn't fail main operation
- Efficient WebSocket room targeting

### 10. Future Enhancements

#### 10.1 Potential Improvements

1. **Refund Processing**: Automatic refund initiation for online payments
2. **Cancellation Penalties**: Configurable cancellation fees based on timing
3. **Booking Modifications**: Allow seat count or passenger changes
4. **Trip Reminders**: Automated notifications before departure
5. **Review System**: Post-trip review and rating
6. **Booking History Export**: PDF/CSV download of booking history
7. **Multi-language Support**: Localized UI and notifications
8. **Advanced Filtering**: Filter by date range, price range, destinations

#### 10.2 Analytics Integration

- Track cancellation rates and reasons
- Monitor booking patterns (private vs shared)
- Payment method preferences
- Time-to-cancellation metrics

### 11. API Reference Quick Links

**Endpoints**:
- `GET /api/passengers/bookings` - List bookings
- `GET /api/passengers/bookings/{id}` - Get booking details
- `POST /api/passengers/bookings/{id}/cancel` - Cancel booking
- `GET /api/passengers/bookings?stats=true` - Get statistics

**Related APIs**:
- `POST /api/bookings` - Create private trip booking
- `POST /api/bookings/shared` - Create shared ride booking
- `POST /api/payments/mock-success` - Mock payment success

### 12. Deployment Notes

#### 12.1 Environment Variables

Required environment variables (from `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_APP_URL` - Application base URL

#### 12.2 Database Migrations

Ensure Prisma schema is up to date:
```bash
npx prisma generate
npx prisma migrate dev
```

#### 12.3 Dependencies

Key dependencies:
- `@prisma/client` - Database ORM
- `socket.io` - Real-time WebSocket support
- `date-fns` - Date formatting in UI
- `next` - React framework

---

## Summary

The Passenger Booking Management feature (UC-36) provides a comprehensive, user-friendly interface for passengers to manage their bookings. Key highlights include:

✅ **Complete Booking Visibility**: View all bookings with detailed trip, payment, and driver information  
✅ **Trip Type Differentiation**: Clear visual distinction between private and shared rides  
✅ **Payment Method Display**: Transparent payment method and status tracking  
✅ **Smart Cancellation**: Validated cancellation with real-time driver notifications  
✅ **Responsive Design**: Mobile-friendly UI with modern design patterns  
✅ **Real-Time Updates**: WebSocket integration for immediate driver notifications  
✅ **Secure & Validated**: Proper authorization and input validation throughout  

This implementation fulfills all requirements specified in UC-36 and integrates seamlessly with the existing booking, payment, and driver discovery systems.
