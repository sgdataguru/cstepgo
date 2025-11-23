# Driver Availability Management - Feature Guide

## Overview

The Driver Availability Management system is a comprehensive feature that enables drivers to manage their work schedule, set preferences, and automatically sync their status with the StepperGO platform. This feature is critical for maintaining accurate driver availability data and reducing failed bookings.

## Key Features

### 1. Real-Time Status Management
- **Online/Offline Toggle:** Drivers can quickly switch between AVAILABLE, BUSY, and OFFLINE states
- **Last Activity Tracking:** System tracks when drivers were last active
- **Auto-Offline:** Automatically sets drivers offline after configured period of inactivity

### 2. Availability Preferences
- **Service Radius:** Configure service area from 5km to 100km
- **Trip Type Preferences:**
  - Private trips (entire vehicle)
  - Shared trips (per-seat bookings)
  - Long-distance trips (intercity/cross-border)

### 3. Break Time Scheduling
- **Scheduled Breaks:** Create planned break periods
- **Unavailability Periods:** Schedule time off in advance
- **Recurring Schedules:** Set up recurring break times (e.g., daily lunch)
- **Automatic Status Changes:** Status updates automatically based on schedules

### 4. History & Audit Trail
- **Change Tracking:** All status changes are logged
- **Trigger Source:** Track whether changes were made by driver, system, or admin
- **Reason Logging:** Optional reason field for status changes

### 5. Admin Monitoring
- **Dashboard Overview:** Real-time view of all driver availability
- **Statistics:** Breakdown by status, city, and other factors
- **Recent Changes:** Monitor recent availability changes
- **Alert System:** Notifications for unexpected offline events

## Quick Start

### For Drivers

1. **Login to your driver dashboard**
2. **Set your status:**
   - Click "Go Online" to start receiving trips
   - Click "Busy" when you need a short pause
   - Click "Go Offline" when done for the day

3. **Configure preferences:**
   - Click the settings icon
   - Adjust your service radius
   - Select trip types you want to accept

4. **Schedule breaks:**
   - Click "Add Schedule"
   - Set start and end times
   - Choose schedule type (break/unavailable)
   - Add optional reason
   - Click "Create Schedule"

### For Admins

1. **View availability dashboard:**
   - Navigate to Admin > Drivers > Availability
   - See real-time statistics
   - Monitor recent changes

2. **Filter and search:**
   - Filter by status (Online/Busy/Offline)
   - Filter by city
   - Search by driver name or ID

See [Full Feature Documentation](driver-availability-management.md) for detailed information.
