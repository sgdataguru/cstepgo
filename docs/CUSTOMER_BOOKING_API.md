# Customer Private Trip Booking API Documentation

## Overview

This API enables customers to book private trips which are automatically broadcast to nearby drivers through the existing Driver Trip Discovery system. The implementation ensures proper multi-tenant separation and real-time driver notifications.

## Base URL

```
https://steppergo.com/api
```

For development:
```
http://localhost:3000/api
```

---

## Authentication

All booking endpoints require user authentication (future implementation will use JWT tokens in Authorization header). Currently using `userId` parameter for testing.

**Header:**
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Create Private Trip Booking

Creates a new private trip booking and automatically broadcasts it to nearby drivers.

**Endpoint:** `POST /api/bookings`

**Request Body:**
```json
{
  "userId": "string",                    // Required: Customer ID
  "tripType": "private" | "shared",      // Required: Type of trip
  "origin": {                            // Required: Pickup location
    "name": "string",
    "address": "string",
    "lat": number,
    "lng": number
  },
  "destination": {                       // Required: Drop-off location
    "name": "string",
    "address": "string",
    "lat": number,
    "lng": number
  },
  "departureTime": "ISO8601 datetime",   // Required: When trip should start
  "returnTime": "ISO8601 datetime",      // Optional: Return trip time
  "passengers": [                        // Required: At least one passenger
    {
      "name": "string",
      "phone": "string (optional)",
      "email": "string (optional)"
    }
  ],
  "seatsBooked": number,                 // Required: 1-8
  "notes": "string",                     // Optional: Special instructions
  "vehicleType": "string"                // Optional: sedan, suv, van
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "bookingId": "clx1234567890",
    "tripId": "clx0987654321",
    "status": "pending",
    "totalAmount": 5500,
    "currency": "KZT",
    "message": "Booking created successfully. Finding nearby drivers..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "departureTime",
      "message": "Invalid datetime format"
    }
  ]
}
```

**Pricing Calculation:**
- Base Fare: 1000 KZT
- Per-kilometer Rate: 300 KZT
- Platform Fee: 15% of base price
- Formula: `(1000 + (distance_km * 300 * seats)) * 1.15`

**Example:**
```bash
curl -X POST https://steppergo.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user123",
    "tripType": "private",
    "origin": {
      "name": "Almaty Airport",
      "address": "Mailin St 2, Almaty",
      "lat": 43.3521,
      "lng": 77.0408
    },
    "destination": {
      "name": "City Center",
      "address": "Dostyk Ave, Almaty",
      "lat": 43.2381,
      "lng": 76.9452
    },
    "departureTime": "2025-01-15T14:00:00Z",
    "passengers": [
      {
        "name": "John Doe",
        "phone": "+77071234567",
        "email": "john@example.com"
      }
    ],
    "seatsBooked": 2,
    "notes": "Please arrive 10 minutes early"
  }'
```

---

### 2. Get Booking Details

Retrieves detailed information about a specific booking.

**Endpoint:** `GET /api/bookings/:id`

**URL Parameters:**
- `id` (required): Booking ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "tripId": "clx0987654321",
    "status": "pending",
    "seatsBooked": 2,
    "totalAmount": 5500,
    "currency": "KZT",
    "passengers": [
      {
        "name": "John Doe",
        "phone": "+77071234567",
        "email": "john@example.com"
      }
    ],
    "notes": "Please arrive 10 minutes early",
    "createdAt": "2025-01-10T10:30:00Z",
    "confirmedAt": null,
    "cancelledAt": null,
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+77071234567"
    },
    "trip": {
      "id": "clx0987654321",
      "title": "Private Ride: Almaty Airport → City Center",
      "status": "published",
      "departureTime": "2025-01-15T14:00:00Z",
      "origin": {
        "name": "Almaty Airport",
        "address": "Mailin St 2, Almaty",
        "coordinates": { "lat": 43.3521, "lng": 77.0408 }
      },
      "destination": {
        "name": "City Center",
        "address": "Dostyk Ave, Almaty",
        "coordinates": { "lat": 43.2381, "lng": 76.9452 }
      },
      "driver": null
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

**Example:**
```bash
curl -X GET https://steppergo.com/api/bookings/clx1234567890 \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get User's Bookings

Retrieves all bookings for a specific user with optional status filtering.

**Endpoint:** `GET /api/bookings`

**Query Parameters:**
- `userId` (required): User ID
- `status` (optional): Filter by status
  - Values: `all`, `pending`, `confirmed`, `cancelled`, `completed`
  - Default: `all`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "clx1234567890",
        "tripId": "clx0987654321",
        "status": "confirmed",
        "seatsBooked": 2,
        "totalAmount": 5500,
        "currency": "KZT",
        "passengers": [...],
        "notes": "Please arrive 10 minutes early",
        "createdAt": "2025-01-10T10:30:00Z",
        "confirmedAt": "2025-01-10T11:00:00Z",
        "trip": {
          "id": "clx0987654321",
          "title": "Private Ride: Almaty Airport → City Center",
          "departureTime": "2025-01-15T14:00:00Z",
          "status": "in_progress",
          "origin": {...},
          "destination": {...},
          "driver": {
            "id": "drv123",
            "name": "Aibek Nurlan",
            "avatar": "https://cdn.steppergo.com/avatars/drv123.jpg",
            "rating": 4.8,
            "vehicleModel": "Toyota Camry",
            "vehicleMake": "Toyota",
            "licensePlate": "01AA777A"
          }
        }
      }
    ],
    "count": 1
  }
}
```

**Example:**
```bash
# Get all bookings
curl -X GET "https://steppergo.com/api/bookings?userId=user123" \
  -H "Authorization: Bearer <token>"

# Get only pending bookings
curl -X GET "https://steppergo.com/api/bookings?userId=user123&status=pending" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Cancel Booking

Cancels an existing booking. The associated trip will also be cancelled if there are no other confirmed bookings.

**Endpoint:** `PUT /api/bookings/:id`

**URL Parameters:**
- `id` (required): Booking ID

**Request Body:**
```json
{
  "action": "cancel",
  "userId": "string",              // Required: User ID for verification
  "reason": "string"               // Optional: Cancellation reason
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bookingId": "clx1234567890",
    "status": "cancelled",
    "message": "Booking cancelled successfully"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Cannot cancel completed booking"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

**Example:**
```bash
curl -X PUT https://steppergo.com/api/bookings/clx1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "cancel",
    "userId": "user123",
    "reason": "Change of plans"
  }'
```

---

## Booking Status Flow

```
PENDING → CONFIRMED → COMPLETED
   ↓
CANCELLED
```

**Status Descriptions:**

- **PENDING**: Booking created, waiting for driver to accept
- **CONFIRMED**: Driver has accepted the trip
- **CANCELLED**: Booking cancelled by customer or driver
- **COMPLETED**: Trip has been successfully completed

---

## Driver Integration

### Automatic Driver Discovery

When a booking is created:

1. **Trip Creation**: A Trip record is created with `PUBLISHED` status
2. **Driver Broadcast**: Trip is automatically broadcast to all drivers within 25km radius
3. **Discovery Feed**: Trip appears in driver's available trips list
4. **Real-time Notifications**: Drivers receive WebSocket notification about new opportunity

### Driver Acceptance

When a driver accepts the trip via `/api/drivers/trips/accept/:tripId`:

1. **Trip Assignment**: Driver is assigned to the trip
2. **Booking Confirmation**: All PENDING bookings for the trip are automatically set to CONFIRMED
3. **Status Update**: Trip status changes to IN_PROGRESS
4. **Driver Status**: Driver availability set to BUSY
5. **Customer Notification**: Customer receives notification that driver has been assigned

---

## Multi-Tenant Architecture

### Tenant Separation

- **Booking Level**: Each booking is linked to a specific user (tenant context)
- **Trip Level**: Trip organizer field tracks which tenant created the booking
- **Driver Assignment**: Geographic boundaries ensure proper driver matching
- **Data Isolation**: Queries filter by user/tenant to prevent data leakage

### Tenant Context Flow

```
Customer (Tenant A) → Booking → Trip → Driver Discovery
                                   ↓
              Drivers see trip with tenant metadata
                                   ↓
              Driver accepts → Booking confirmed
                                   ↓
              Customer (Tenant A) receives driver assignment
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Booking Creation**: 10 requests per minute per user
- **Booking Queries**: 30 requests per minute per user
- **Booking Updates**: 5 requests per minute per user

---

## Webhooks (Future)

Planned webhook events for real-time updates:

- `booking.created` - New booking created
- `booking.confirmed` - Driver accepted trip
- `booking.cancelled` - Booking cancelled
- `booking.completed` - Trip completed
- `driver.assigned` - Driver assigned to booking
- `driver.arrived` - Driver arrived at pickup location

---

## Testing

Run the test script to verify all endpoints:

```bash
cd /home/runner/work/cstepgo/cstepgo
chmod +x test-customer-booking.sh
./test-customer-booking.sh
```

---

## Support

For API support or questions:
- Email: api-support@steppergo.com
- Documentation: https://docs.steppergo.com
- Issue Tracker: https://github.com/sgdataguru/cstepgo/issues
