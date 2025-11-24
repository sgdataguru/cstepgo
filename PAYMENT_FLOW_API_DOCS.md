# Payment Flow API Documentation

This document describes the payment flow APIs for the StepperGO platform, supporting both online payment and cash-to-driver payment methods.

## Overview

The payment flow system supports two payment methods:
- **ONLINE**: Passenger pays online before the trip (currently using mock payment for POC)
- **CASH_TO_DRIVER**: Passenger pays cash directly to the driver

## API Endpoints

### 1. Mock Payment API (POC)

#### GET /api/payments/mock-success
Get information about the mock payment API.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Mock Payment API",
    "version": "1.0.0",
    "description": "POC mock payment endpoint that always returns successful transactions",
    "usage": {
      "method": "POST",
      "endpoint": "/api/payments/mock-success",
      "body": {
        "bookingId": "string (required)",
        "amount": "number (required)",
        "currency": "string (optional, default: KZT)"
      }
    }
  }
}
```

#### POST /api/payments/mock-success
Process a mock payment (always succeeds).

**Request:**
```json
{
  "bookingId": "clxy123abc...",
  "amount": 5000,
  "currency": "KZT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "clxy456def...",
    "transactionId": "mock_tx_abc123...",
    "clientSecret": "mock_cs_xyz789...",
    "amount": 5000,
    "currency": "KZT",
    "status": "SUCCEEDED",
    "paymentMethod": "mock_card",
    "last4": "4242",
    "succeededAt": "2024-11-24T17:00:00.000Z",
    "message": "Mock payment processed successfully (POC)"
  }
}
```

**Notes:**
- This endpoint automatically confirms the booking
- Creates or updates payment record
- Marks payment status as SUCCEEDED
- Compatible with future Stripe Payment Links integration

---

### 2. Booking APIs

#### POST /api/bookings
Create a new booking for a trip.

**Authentication:** Required (Bearer token)

**Request:**
```json
{
  "tripId": "clxy789ghi...",
  "seatsBooked": 2,
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "phone": "+77771234567"
    },
    {
      "name": "Jane Smith",
      "age": 28
    }
  ],
  "paymentMethodType": "ONLINE",
  "notes": "Please pick us up near the fountain"
}
```

**Fields:**
- `tripId` (required): ID of the trip to book
- `seatsBooked` (required): Number of seats to book (must match passenger count)
- `passengers` (required): Array of passenger objects
- `paymentMethodType` (required): "ONLINE" or "CASH_TO_DRIVER"
- `notes` (optional): Additional notes for the driver

**Response for CASH_TO_DRIVER:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxy123abc...",
      "tripId": "clxy789ghi...",
      "userId": "clxy456def...",
      "status": "CONFIRMED",
      "seatsBooked": 2,
      "totalAmount": "10000",
      "currency": "KZT",
      "paymentMethodType": "CASH_TO_DRIVER",
      "passengers": [...],
      "trip": {...},
      "payment": {
        "id": "clxy999xyz...",
        "status": "PENDING",
        "paymentMethod": "cash"
      },
      "confirmedAt": "2024-11-24T17:00:00.000Z",
      "createdAt": "2024-11-24T17:00:00.000Z"
    },
    "message": "Booking confirmed. Payment will be collected by driver.",
    "requiresPayment": false
  }
}
```

**Response for ONLINE:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxy123abc...",
      "tripId": "clxy789ghi...",
      "userId": "clxy456def...",
      "status": "PENDING",
      "seatsBooked": 2,
      "totalAmount": "10000",
      "currency": "KZT",
      "paymentMethodType": "ONLINE",
      "passengers": [...],
      "trip": {...},
      "payment": null,
      "confirmedAt": null,
      "createdAt": "2024-11-24T17:00:00.000Z"
    },
    "message": "Booking created. Please proceed with payment.",
    "requiresPayment": true
  }
}
```

**Error Responses:**
- 400: Missing required fields, invalid payment method, not enough seats
- 404: Trip not found
- 401: Authentication required

**Business Logic:**
- Validates trip is PUBLISHED and has enough seats
- Prevents duplicate bookings for same user/trip
- CASH_TO_DRIVER bookings are auto-confirmed
- ONLINE bookings remain PENDING until payment succeeds
- Decrements available seats from trip

---

#### GET /api/bookings
Get all bookings for authenticated user.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, CONFIRMED, CANCELLED, COMPLETED)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxy123abc...",
      "status": "CONFIRMED",
      "seatsBooked": 2,
      "totalAmount": "10000",
      "currency": "KZT",
      "paymentMethodType": "CASH_TO_DRIVER",
      "trip": {
        "id": "clxy789ghi...",
        "title": "Almaty to Astana",
        "departureTime": "2024-11-25T09:00:00.000Z",
        "originName": "Almaty",
        "destName": "Astana"
      },
      "payment": {
        "status": "PENDING",
        "paymentMethod": "cash"
      },
      "createdAt": "2024-11-24T17:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### GET /api/bookings/[id]
Get details of a specific booking.

**Authentication:** Required (Bearer token)

**Authorization:** User must own the booking or be the driver/admin

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxy123abc...",
    "status": "CONFIRMED",
    "seatsBooked": 2,
    "totalAmount": "10000",
    "currency": "KZT",
    "paymentMethodType": "CASH_TO_DRIVER",
    "passengers": [
      {
        "name": "John Doe",
        "age": 30,
        "phone": "+77771234567"
      }
    ],
    "notes": "Please pick us up near the fountain",
    "trip": {
      "id": "clxy789ghi...",
      "title": "Almaty to Astana",
      "departureTime": "2024-11-25T09:00:00.000Z",
      "organizer": {...},
      "driver": {...}
    },
    "payment": {
      "id": "clxy999xyz...",
      "status": "PENDING",
      "paymentMethod": "cash",
      "amount": "10000"
    },
    "user": {
      "id": "clxy456def...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+77771234567"
    },
    "createdAt": "2024-11-24T17:00:00.000Z",
    "confirmedAt": "2024-11-24T17:00:00.000Z"
  }
}
```

---

#### PATCH /api/bookings/[id]
Update a booking (currently supports cancellation).

**Authentication:** Required (Bearer token)

**Authorization:** User must own the booking

**Request:**
```json
{
  "action": "cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxy123abc...",
    "status": "CANCELLED",
    "cancelledAt": "2024-11-24T18:00:00.000Z"
  },
  "message": "Booking cancelled successfully"
}
```

**Note:** Cancelling a booking restores the seats to the trip.

---

### 3. Driver Booking View API

#### GET /api/drivers/trips/[tripId]/bookings
Get all bookings for a trip with payment information (driver view).

**Authentication:** Required (Bearer token)

**Authorization:** User must be the assigned driver or admin

**Response:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "clxy789ghi...",
      "title": "Almaty to Astana",
      "departureTime": "2024-11-25T09:00:00.000Z",
      "originName": "Almaty",
      "destName": "Astana"
    },
    "bookings": [
      {
        "id": "clxy123abc...",
        "passenger": {
          "id": "clxy456def...",
          "name": "John Doe",
          "phone": "+77771234567",
          "email": "john@example.com"
        },
        "seatsBooked": 2,
        "totalAmount": 10000,
        "currency": "KZT",
        "status": "CONFIRMED",
        "paymentMethod": "CASH_TO_DRIVER",
        "paymentStatus": "PENDING",
        "paymentInfo": {
          "isPrepaid": false,
          "isCashCollection": true,
          "paymentMethod": "cash",
          "last4": null,
          "amountToCollect": 10000
        },
        "passengers": [
          {
            "name": "John Doe",
            "age": 30
          }
        ],
        "notes": "Please pick us up near the fountain",
        "createdAt": "2024-11-24T17:00:00.000Z",
        "confirmedAt": "2024-11-24T17:00:00.000Z"
      },
      {
        "id": "clxy999zzz...",
        "passenger": {
          "id": "clxy777aaa...",
          "name": "Jane Smith",
          "phone": "+77779876543"
        },
        "seatsBooked": 1,
        "totalAmount": 5000,
        "currency": "KZT",
        "status": "CONFIRMED",
        "paymentMethod": "ONLINE",
        "paymentStatus": "SUCCEEDED",
        "paymentInfo": {
          "isPrepaid": true,
          "isCashCollection": false,
          "paymentMethod": "mock_card",
          "last4": "4242",
          "amountToCollect": 0
        },
        "passengers": [
          {
            "name": "Jane Smith"
          }
        ],
        "createdAt": "2024-11-24T16:00:00.000Z",
        "confirmedAt": "2024-11-24T16:05:00.000Z"
      }
    ],
    "paymentSummary": {
      "totalBookings": 2,
      "prepaidBookings": 1,
      "cashCollectionBookings": 1,
      "totalCashToCollect": 10000,
      "totalPrepaidAmount": 5000,
      "currency": "KZT"
    }
  }
}
```

**Payment Info Fields:**
- `isPrepaid`: Boolean indicating if payment was already received online
- `isCashCollection`: Boolean indicating if payment should be collected by driver
- `paymentMethod`: Payment method used (cash, mock_card, etc.)
- `last4`: Last 4 digits of card (if applicable)
- `amountToCollect`: Amount driver needs to collect (0 if prepaid)

---

## Payment Flow Diagrams

### Online Payment Flow
```
1. Passenger creates booking with paymentMethodType="ONLINE"
   → Booking status: PENDING
   → Payment: null
   → Seats reserved

2. Passenger calls /api/payments/mock-success with bookingId
   → Payment created with status SUCCEEDED
   → Booking status: CONFIRMED
   → confirmedAt timestamp set

3. Driver views trip bookings
   → Sees booking as "Prepaid"
   → No cash collection needed
```

### Cash to Driver Flow
```
1. Passenger creates booking with paymentMethodType="CASH_TO_DRIVER"
   → Booking status: CONFIRMED (immediately)
   → Payment created with status PENDING, method "cash"
   → Seats reserved
   → confirmedAt timestamp set

2. Driver views trip bookings
   → Sees booking as "Cash Collection"
   → Amount to collect shown
   → Driver collects cash at pickup

3. Driver marks payment as received (future feature)
   → Payment status: SUCCEEDED
```

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation error, insufficient data)
- `401`: Unauthorized (missing or invalid auth token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Integration Notes

### Future Stripe Integration

The current implementation is designed to be compatible with future Stripe Payment Links:

1. When implementing Stripe:
   - Replace `/api/payments/mock-success` with Stripe Payment Intent creation
   - Add Stripe webhook handler for payment confirmations
   - Update `stripeIntentId` with real Stripe payment intent ID
   - Keep the same booking confirmation flow

2. The schema already supports:
   - Optional `stripeIntentId` for both mock and real Stripe IDs
   - `stripeClientSecret` for client-side payment handling
   - `paymentMethod` and `last4` for card details
   - Flexible `metadata` JSON field for additional payment info

3. Minimal changes needed:
   - Create Stripe Payment Intent in booking flow
   - Handle Stripe webhooks for payment confirmation
   - Update mock payment endpoint to Stripe redirect

---

## Testing

### Manual Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create a test user and get auth token**

3. **Create a test trip**

4. **Test Cash Payment:**
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tripId": "TRIP_ID",
       "seatsBooked": 1,
       "passengers": [{"name": "John Doe"}],
       "paymentMethodType": "CASH_TO_DRIVER"
     }'
   ```

5. **Test Online Payment:**
   ```bash
   # Create booking
   BOOKING_ID=$(curl -X POST http://localhost:3000/api/bookings \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tripId": "TRIP_ID",
       "seatsBooked": 1,
       "passengers": [{"name": "Jane Smith"}],
       "paymentMethodType": "ONLINE"
     }' | jq -r '.data.booking.id')
   
   # Process mock payment
   curl -X POST http://localhost:3000/api/payments/mock-success \
     -H "Content-Type: application/json" \
     -d "{
       \"bookingId\": \"$BOOKING_ID\",
       \"amount\": 5000,
       \"currency\": \"KZT\"
     }"
   ```

6. **View driver bookings:**
   ```bash
   curl http://localhost:3000/api/drivers/trips/TRIP_ID/bookings \
     -H "Authorization: Bearer DRIVER_TOKEN"
   ```

---

## Security Considerations

1. **Authentication**: All booking and driver APIs require JWT authentication
2. **Authorization**: 
   - Users can only view/modify their own bookings
   - Drivers can only view bookings for their assigned trips
   - Admins have full access
3. **Validation**:
   - All inputs are validated
   - Payment amounts are verified against booking amounts
   - Duplicate bookings are prevented
4. **Race Conditions**:
   - Database transactions ensure atomic seat reservations
   - Payment status updates are idempotent

---

## Support

For issues or questions about the payment flow APIs:
- Check the main README.md
- Review the code in `src/app/api/bookings/` and `src/app/api/payments/`
- Contact the development team
