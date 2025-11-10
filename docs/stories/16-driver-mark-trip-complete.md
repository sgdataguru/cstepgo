# User Story: 16 - Driver Mark Trip as Complete

**As a** driver,
**I want** to mark a trip as completed after finishing the journey,
**so that** the system can process payments and update my trip history.

## Acceptance Criteria

### Driver Dashboard - Active Trips Section
* URL: `/driver/dashboard`
* Section: **"Active Trips"** (trips driver has accepted but not yet completed)
* Each active trip card shows:
  - Trip: Origin → Destination
  - Departure Date/Time
  - Status Badge: "In Progress" OR "Scheduled"
  - Passenger(s): Names and seat count
  - Vehicle: [Type] - [License Plate]
  - "Mark Complete" button

### "Mark Complete" Button Behavior
* **Before Departure Time**:
  - Button disabled (grayed out)
  - Tooltip: "You can mark this trip complete after departure time: [Date/Time]"

* **After Departure Time**:
  - Button enabled (green, prominent)
  - Tooltip: "Trip started. Mark complete when journey is finished."

### Completion Confirmation Flow
1. Driver clicks "Mark Complete"
2. Modal appears:
   ```
   Confirm Trip Completion
   
   Trip: Bishkek → Osh (3 passengers)
   Departed: Nov 6, 2025, 9:00 AM
   
   Did the trip complete successfully?
   
   [Yes, Trip Completed] [No, There Was an Issue]
   ```

3. **If "Yes, Trip Completed"**:
   - Ask: "Were there any route changes or extra stops?"
     - [ ] No changes
     - [ ] Minor route adjustment (explain):___
     - [ ] Additional stops requested by passengers (explain):___
   
   - Ask: "Any feedback about passengers?" (optional text field)
   
   - [Confirm Completion] button

4. **System Updates**:
   - Booking status: `driver_accepted` → `completed`
   - Trip status updated in `driver_assignments`: `status = 'completed'`, `completed_at = NOW()`
   - Payment released to driver (see Payment Processing below)
   - Passengers notified: "Your trip has been completed. Please rate your driver!"
   - Trip moves to "Completed Trips" section

### Payment Processing on Completion
* Calculate driver payout:
  ```
  Booking Total: $200
  Platform Fee (20%): -$40
  Driver Payout: $160
  ```

* Create payout record:
  - `driver_payouts` table entry
  - Status: `pending` (awaiting platform admin approval - Gate 3)
  - Scheduled payout date: Next Friday (weekly batches)

* Driver sees notification:
  - "Trip completed! Your payout of $160 will be processed on [Date]"

### Completed Trips History
* URL: `/driver/dashboard` → "Completed Trips" tab
* Each completed trip shows:
  - Trip details
  - Completion Date
  - Payout Amount
  - Payout Status: Badge (Pending / Paid / Held)
  - Passenger Rating (if passenger rated driver)
  - Action: [View Receipt]

### Edge Cases Handling

**Case 1: Driver Cancels Trip (After Acceptance)**
* From active trip card, [•••] menu → "Cancel Trip"
* Reason required: Dropdown (Vehicle breakdown, Emergency, Passenger no-show, Other)
* Consequences shown:
  - "Passengers will be refunded"
  - "Your cancellation rate will increase (currently: [X]%)"
  - "High cancellation rate may limit future bookings"
* Confirmation button: "Cancel Trip"
* System actions:
  - Booking status → `driver_cancelled`
  - Full refund to passengers
  - Trip no longer shown in driver dashboard
  - Admin notified of cancellation

**Case 2: Passenger No-Show**
* Driver arrives at pickup location, passenger doesn't show up
* Driver can mark: "Passenger No-Show"
* Evidence required:
  - Photo of location (GPS-tagged)
  - Waited at least 15 minutes past departure time
* System:
  - Booking status → `passenger_no_show`
  - Driver still receives 50% payout (cancellation fee)
  - Passenger charged, no refund
  - Passenger rating decreases

**Case 3: Trip Interrupted (Accident, Weather)**
* Driver marks: "Trip Interrupted"
* Reason required: Dropdown + explanation
* Admin review required before payout
* Partial payout based on distance covered

## Technical Notes

### Database Schema Updates
* `driver_assignments` table:
  ```sql
  status: ENUM ('accepted', 'completed', 'cancelled', 'interrupted')
  completed_at: TIMESTAMP NULL
  completion_notes: TEXT NULL
  route_changes: JSONB NULL
  ```

* `driver_payouts` table:
  ```sql
  id: UUID
  driver_id: UUID FK
  trip_id: UUID FK
  booking_id: UUID FK
  amount: DECIMAL
  platform_fee: DECIMAL
  net_payout: DECIMAL
  status: ENUM ('pending', 'approved', 'paid', 'held')
  scheduled_payout_date: DATE
  actual_payout_date: DATE NULL
  payout_method: ENUM ('bank_transfer', 'mobile_money', 'cash')
  created_at: TIMESTAMP
  ```

### Business Logic
```javascript
async function markTripComplete(tripId, driverId, completionData) {
  // Validate: Departure time has passed
  const trip = await db.trips.findUnique({ where: { id: tripId } });
  if (new Date() < new Date(trip.departure_at)) {
    throw new Error("Cannot complete trip before departure time");
  }
  
  // Update booking and assignment
  await db.$transaction([
    db.bookings.updateMany({
      where: { trip_id: tripId },
      data: { status: 'completed', completed_at: new Date() }
    }),
    db.driver_assignments.update({
      where: { trip_id: tripId, driver_id: driverId },
      data: { 
        status: 'completed', 
        completed_at: new Date(),
        completion_notes: completionData.notes
      }
    })
  ]);
  
  // Calculate and create payout
  const payout = calculateDriverPayout(trip.total_price);
  await createPayoutRecord(driverId, tripId, payout);
  
  // Notify passengers
  await notifyPassengersToRate(tripId);
}
```

### PostHog Events
* `driver_trip_completed` (trip_id, time_to_complete_after_departure)
* `driver_trip_cancelled` (trip_id, reason, cancellation_rate)
* `driver_payout_created` (amount, scheduled_date)
* `passenger_no_show_reported` (trip_id)

### Notifications
* **To Passengers** (upon completion):
  - Push: "Your trip to [Destination] is complete! How was your experience?"
  - Email: Trip summary + rating link
  - SMS: "Trip complete. Rate driver: [Short Link]"

* **To Driver** (upon completion):
  - Push: "Trip marked complete. Payout of $160 scheduled for [Date]"
  - Dashboard: Badge notification

## Success Metrics
* Trip completion rate: >95% (target)
* Avg time to mark complete after departure: <2 hours
* Driver cancellation rate: <5%
* Passenger no-show rate: <3%
* Payout processing time: <7 days from completion

## Gate Assignment
**Gate 2** (Basic completion flow with manual payout approval)
**Gate 3** (Automated payouts, geo-verification of completion, dispute resolution)

## Notes from Transcript
* Ming: "When the trip in the driver should click a bottom that trip completed something like that and when the trip completed there is a should be a notification for the tourist which is you can read or write review about the driver"
* Mahesh: "We need to monitor hundreds of drivers... you cannot monitor by physical right so... when you finish the trip you need to click some bottom that trip is completed"
* Business Requirement: Without completion tracking, platform has no way to trigger payouts or know trip status
