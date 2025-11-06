# User Story: Epic G.2 - Dynamic Price Drop (Per-Seat)

**Epic:** G — Policies (Cancellations, No-shows)

**As a** traveler,
**I want** to see trip prices decrease as more people book,
**so that** I'm incentivized to join popular trips early.

**As a** driver,
**I want** prices to drop in controlled increments,
**so that** I fill seats while maintaining minimum profitability.

## Acceptance Criteria

### Pricing Mode Configuration
* Admin sets pricing mode per trip (Story E.3):
  - **Fixed Pricing** (default): Price never changes
  - **Dynamic Pricing** (opt-in): Price drops as seats fill

* Dynamic pricing fields:
  - Base price per seat: $[X] (starting price)
  - Minimum price per seat: $[Y] (floor price)
  - Price drop increment: [Z]% (e.g., 5%, 10%)
  - Drop trigger: "Every [N] seats booked"

### Price Drop Logic

**Example Configuration:**
- Base price: $100
- Min price: $70
- Drop increment: 10%
- Drop trigger: Every 2 seats booked
- Total capacity: 10 seats

**Price Schedule:**
| Seats Booked | Price Per Seat | Calculation |
|--------------|---------------|-------------|
| 0-1          | $100          | Base price  |
| 2-3          | $90           | $100 - 10%  |
| 4-5          | $80           | $90 - 10%   |
| 6-7          | $70           | $80 - 10% (floor reached) |
| 8-10         | $70           | Min price enforced |

### Display to Travelers

**Trip List View:**
* Price display:
  - Current price: **"$90/seat"** (large, bold)
  - Original price: ~~"$100"~~ (strikethrough)
  - Seats filled badge: "4 of 10 seats booked"
  - Urgency message: "Price drops to $80 after 2 more bookings!"

**Trip Detail Page:**
* Pricing widget:
  - Visual progress bar:
    ```
    [████████░░] 8 of 10 seats booked
    Current: $70/seat | Min: $70 | Max: $100
    Price locked: No further drops
    ```
  - Price history (optional - G4):
    - Chart showing price over time

### Price Guarantee at Booking
* When traveler starts booking:
  - Lock current price for 10 minutes (soft hold period - Story B.3)
  - Display: "Your price: $90/seat (guaranteed for 10 min)"
  - If price drops during hold: Traveler pays locked price (no automatic discount)
  - If hold expires and traveler rebooks: New (potentially lower) price applies

### Price Never Increases
* **Critical rule**: Once a price drops, it NEVER increases
* Even if travelers cancel and seats open up: Price stays at lowest reached
* Example:
  - 6 seats booked → Price drops to $70
  - 2 travelers cancel → 4 seats available
  - Price remains $70 (does not return to $80)

### Price Commitment for Existing Bookings
* Travelers who booked at higher price: Do NOT receive refunds when price drops
* Display on booking confirmation: "Price locked at $100/seat (your booking price)"
* No retroactive adjustments (standard marketplace practice)

## Technical Notes

### Database Schema
* `trip_pricing` table:
  ```sql
  pricing_mode: 'fixed' | 'dynamic'
  base_price_per_seat: DECIMAL (starting price)
  min_price_per_seat: DECIMAL (floor)
  max_price_per_seat: DECIMAL (same as base for dynamic)
  drop_increment_pct: INT (e.g., 5, 10)
  drop_trigger_seats: INT (e.g., 2)
  current_price_per_seat: DECIMAL (updated as seats book)
  lowest_price_reached: DECIMAL (for enforcement)
  ```

### Price Calculation Function
```typescript
// lib/dynamic-pricing.ts
export const calculateCurrentPrice = (
  pricing: TripPricing,
  seatsBooked: number
): number => {
  if (pricing.pricing_mode === 'fixed') {
    return pricing.base_price_per_seat;
  }

  // Dynamic pricing
  const dropSteps = Math.floor(seatsBooked / pricing.drop_trigger_seats);
  let currentPrice = pricing.base_price_per_seat;

  for (let i = 0; i < dropSteps; i++) {
    const dropAmount = currentPrice * (pricing.drop_increment_pct / 100);
    currentPrice = Math.max(currentPrice - dropAmount, pricing.min_price_per_seat);
  }

  return currentPrice;
};
```

### Price Update Trigger
* After each successful booking (payment_succeeded):
  ```sql
  UPDATE trip_pricing
  SET current_price_per_seat = calculate_current_price(trip_id),
      lowest_price_reached = LEAST(lowest_price_reached, current_price_per_seat)
  WHERE trip_id = $trip_id;
  ```

### PostHog Events
* `price_drop_occurred` (trip_id, old_price, new_price, seats_booked)
* `dynamic_pricing_viewed` (trip_id, current_price, seats_available)

### Edge Cases
* Min price = base price → Effectively fixed pricing
* Drop trigger > seat capacity → No drops possible (config validation warning)
* Multiple bookings simultaneous → Atomic transaction ensures correct price calculation
* Cancellations → Price does NOT increase (enforced by `lowest_price_reached`)

## Success Metrics
* Dynamic pricing adoption: >30% of trips (driver opt-in)
* Avg seat fill rate: +20% for dynamic vs fixed pricing
* Traveler satisfaction: No negative feedback on pricing strategy

## Gate Assignment
**Gate 3/4** (Dynamic pricing - FUTURE, not Gate 2)
**Complexity**: High - requires careful UX design + testing
**Dependencies**: Fixed pricing must be stable first (Gate 2)