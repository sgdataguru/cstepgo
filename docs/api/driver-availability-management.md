# Driver Availability Management API

Comprehensive API documentation for the Driver Availability Management feature in StepperGO.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Driver Availability](#driver-availability)
  - [Schedule Management](#schedule-management)
  - [Admin Monitoring](#admin-monitoring)
- [Data Models](#data-models)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)

## Overview

The Driver Availability Management system allows drivers to:
- Set their online/offline status
- Configure availability preferences (service radius, trip types)
- Schedule breaks and unavailability periods
- Automatically manage status based on activity

## Authentication

All API endpoints require authentication via the `x-driver-id` header (or `x-admin-id` for admin endpoints).

```
x-driver-id: <driver-id>
```

## Endpoints

### Driver Availability

#### Get Availability Status

Get current availability status and preferences for the authenticated driver.

**Endpoint:** `GET /api/drivers/availability`

**Headers:**
```
x-driver-id: <driver-id>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStatus": {
      "availability": "AVAILABLE",
      "currentLocation": "Almaty",
      "lastActivityAt": "2024-11-23T10:30:00Z"
    },
    "preferences": {
      "serviceRadiusKm": 50,
      "acceptsPrivateTrips": true,
      "acceptsSharedTrips": true,
      "acceptsLongDistance": true,
      "autoOfflineMinutes": 30
    },
    "schedules": [
      {
        "id": "schedule_123",
        "startTime": "2024-11-23T12:00:00Z",
        "endTime": "2024-11-23T13:00:00Z",
        "scheduleType": "break",
        "reason": "Lunch break",
        "isRecurring": false
      }
    ],
    "recentHistory": [
      {
        "id": "history_456",
        "previousStatus": "OFFLINE",
        "newStatus": "AVAILABLE",
        "changeReason": "Driver went online",
        "triggeredBy": "driver",
        "changedAt": "2024-11-23T09:00:00Z"
      }
    ]
  }
}
```

#### Update Availability Status

Update availability status and preferences.

**Endpoint:** `PUT /api/drivers/availability`

**Headers:**
```
x-driver-id: <driver-id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "availability": "AVAILABLE",
  "currentLocation": "Almaty",
  "serviceRadiusKm": 50,
  "acceptsPrivateTrips": true,
  "acceptsSharedTrips": true,
  "acceptsLongDistance": false,
  "reason": "Going online for the day"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated to AVAILABLE",
  "data": {
    "availability": "AVAILABLE",
    "currentLocation": "Almaty",
    "serviceRadiusKm": 50,
    "acceptsPrivateTrips": true,
    "acceptsSharedTrips": true,
    "acceptsLongDistance": false,
    "lastActivityAt": "2024-11-23T10:35:00Z",
    "updatedAt": "2024-11-23T10:35:00Z"
  }
}
```

**Availability Values:**
- `AVAILABLE` - Driver is online and accepting trips
- `BUSY` - Driver is online but temporarily not accepting new trips
- `OFFLINE` - Driver is offline

### Schedule Management

#### List Schedules

Get all active schedules for the driver.

**Endpoint:** `GET /api/drivers/availability/schedule`

**Headers:**
```
x-driver-id: <driver-id>
```

**Query Parameters:**
- `includeExpired` (boolean) - Include past schedules
- `startDate` (ISO 8601) - Filter by start date
- `endDate` (ISO 8601) - Filter by end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "schedule_123",
      "startTime": "2024-11-23T12:00:00Z",
      "endTime": "2024-11-23T13:00:00Z",
      "scheduleType": "break",
      "reason": "Lunch break",
      "isRecurring": false,
      "recurringPattern": null,
      "isActive": true,
      "createdAt": "2024-11-23T08:00:00Z",
      "updatedAt": "2024-11-23T08:00:00Z"
    }
  ]
}
```

#### Create Schedule

Create a new availability schedule (break, unavailability period).

**Endpoint:** `POST /api/drivers/availability/schedule`

**Headers:**
```
x-driver-id: <driver-id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "startTime": "2024-11-23T12:00:00Z",
  "endTime": "2024-11-23T13:00:00Z",
  "scheduleType": "break",
  "reason": "Lunch break",
  "isRecurring": false,
  "recurringPattern": {
    "dayOfWeek": [1, 2, 3, 4, 5],
    "frequency": "weekly"
  }
}
```

**Schedule Types:**
- `break` - Short break (sets status to BUSY)
- `unavailable` - Planned unavailability (sets status to OFFLINE)
- `custom` - Custom schedule (no automatic status change)

**Response:**
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "schedule_123",
    "startTime": "2024-11-23T12:00:00Z",
    "endTime": "2024-11-23T13:00:00Z",
    "scheduleType": "break",
    "reason": "Lunch break",
    "isRecurring": false,
    "recurringPattern": null,
    "createdAt": "2024-11-23T10:40:00Z"
  }
}
```

**Error Response (Overlap):**
```json
{
  "error": "Schedule overlaps with existing schedule",
  "overlappingSchedules": [
    {
      "id": "schedule_456",
      "startTime": "2024-11-23T11:30:00Z",
      "endTime": "2024-11-23T12:30:00Z",
      "scheduleType": "break"
    }
  ]
}
```

#### Delete Schedule

Cancel/deactivate a schedule.

**Endpoint:** `DELETE /api/drivers/availability/schedule/:scheduleId`

**Headers:**
```
x-driver-id: <driver-id>
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule cancelled successfully"
}
```

### Admin Monitoring

#### Get Driver Availability Overview

Get comprehensive availability data for all drivers (admin only).

**Endpoint:** `GET /api/admin/drivers/availability`

**Headers:**
```
x-admin-id: <admin-id>
```

**Query Parameters:**
- `status` (string) - Filter by availability status
- `city` (string) - Filter by city
- `page` (number) - Page number (default: 1)
- `limit` (number) - Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "driver_123",
        "driverId": "DRV-20240101-00001",
        "name": "John Doe",
        "phone": "+77001234567",
        "email": "john@example.com",
        "availability": "AVAILABLE",
        "currentLocation": "Almaty",
        "lastActivityAt": "2024-11-23T10:30:00Z",
        "preferences": {
          "serviceRadiusKm": 50,
          "acceptsPrivateTrips": true,
          "acceptsSharedTrips": true,
          "acceptsLongDistance": true
        },
        "homeCity": "Almaty",
        "rating": 4.8,
        "completedTrips": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 45,
      "totalPages": 3
    },
    "statistics": {
      "availability": {
        "AVAILABLE": 25,
        "BUSY": 8,
        "OFFLINE": 12
      },
      "totalDrivers": 45,
      "activeSchedules": 15
    },
    "recentChanges": [
      {
        "id": "history_789",
        "driverId": "DRV-20240101-00001",
        "driverName": "John Doe",
        "previousStatus": "OFFLINE",
        "newStatus": "AVAILABLE",
        "changeReason": "Driver went online",
        "triggeredBy": "driver",
        "changedAt": "2024-11-23T09:00:00Z"
      }
    ]
  }
}
```

## Data Models

### Driver Availability Preferences

```typescript
interface DriverAvailabilityPreferences {
  serviceRadiusKm: number;        // 5-100 km
  acceptsPrivateTrips: boolean;   // Accept private bookings
  acceptsSharedTrips: boolean;    // Accept shared bookings
  acceptsLongDistance: boolean;   // Accept long-distance trips
  autoOfflineMinutes: number;     // Auto-offline after inactivity
}
```

### Availability Schedule

```typescript
interface AvailabilitySchedule {
  id: string;
  driverId: string;
  startTime: Date;
  endTime: Date;
  scheduleType: 'break' | 'unavailable' | 'custom';
  reason?: string;
  isRecurring: boolean;
  recurringPattern?: {
    dayOfWeek?: number[];        // 0-6 (Sunday-Saturday)
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Availability History

```typescript
interface AvailabilityHistory {
  id: string;
  driverId: string;
  previousStatus: string;
  newStatus: string;
  changeReason?: string;
  triggeredBy: 'driver' | 'system' | 'admin';
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  changedAt: Date;
}
```

## WebSocket Events

### Driver Status Changes

**Event:** `driver:availability:changed`

**Payload:**
```json
{
  "driverId": "driver_123",
  "previousStatus": "OFFLINE",
  "newStatus": "AVAILABLE",
  "timestamp": "2024-11-23T10:30:00Z"
}
```

### Schedule Activation

**Event:** `driver:schedule:activated`

**Payload:**
```json
{
  "driverId": "driver_123",
  "scheduleId": "schedule_456",
  "scheduleType": "break",
  "startTime": "2024-11-23T12:00:00Z",
  "endTime": "2024-11-23T13:00:00Z"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "availability",
      "message": "Invalid availability status"
    }
  ]
}
```

### Common Error Codes

- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - Conflict (e.g., schedule overlap)
- `400` - Validation error
- `500` - Internal server error

## Rate Limiting

All endpoints are rate-limited to:
- 100 requests per 15 minutes per driver
- 1000 requests per 15 minutes per admin

## Cron Jobs

### Availability Maintenance

**Endpoint:** `GET /api/cron/availability`

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Schedule:** Every 5 minutes

**Tasks:**
1. Set inactive drivers to offline
2. Activate scheduled breaks
3. Deactivate expired breaks

**Response:**
```json
{
  "success": true,
  "message": "Availability maintenance tasks completed",
  "data": {
    "timestamp": "2024-11-23T10:35:00Z",
    "inactiveDriversOffline": 3,
    "schedulesActivated": 5,
    "schedulesDeactivated": 2
  }
}
```

## Best Practices

1. **Update Activity:** Call the availability endpoint periodically to prevent auto-offline
2. **Schedule Breaks:** Create schedules in advance for predictable unavailability
3. **Handle Overlaps:** Check for schedule conflicts before creation
4. **Monitor History:** Track availability changes for debugging
5. **Use WebSockets:** Subscribe to real-time events for immediate updates

## Integration Examples

### React Component

```typescript
import { useEffect, useState } from 'react';

function useDriverAvailability(driverId: string) {
  const [status, setStatus] = useState('OFFLINE');
  
  useEffect(() => {
    // Load current status
    fetch('/api/drivers/availability', {
      headers: { 'x-driver-id': driverId }
    })
      .then(res => res.json())
      .then(data => setStatus(data.data.currentStatus.availability));
    
    // Subscribe to WebSocket updates
    const socket = io();
    socket.on(`driver:${driverId}:availability:changed`, (data) => {
      setStatus(data.newStatus);
    });
    
    return () => socket.disconnect();
  }, [driverId]);
  
  const updateStatus = async (newStatus: string) => {
    const res = await fetch('/api/drivers/availability', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-driver-id': driverId
      },
      body: JSON.stringify({ availability: newStatus })
    });
    
    const data = await res.json();
    setStatus(data.data.availability);
  };
  
  return { status, updateStatus };
}
```

## Support

For questions or issues:
- Email: dev@steppergo.com
- Slack: #steppergo-api
- GitHub: [Issues](https://github.com/steppergo/api/issues)
