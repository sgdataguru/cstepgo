# 22 Trip Acceptance Mechanism - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to accept or decline trip requests with a simple interface, so that I can confirm my availability and commitment to fulfill customer trips.

## Pre-conditions

- Trip discovery system is implemented and functional
- Real-time WebSocket infrastructure is available
- Driver authentication and session management is active
- Trip database with status tracking exists
- Customer notification system is operational

## Business Requirements

- Simple accept/decline interface with clear visual feedback
- Configurable response time limits (30-60 seconds) per trip request
- Real-time synchronization to prevent double-booking
- Automatic timeout handling with trip redistribution
- Confirmation workflow to prevent accidental acceptance
- Earnings estimation display before acceptance decision

## Technical Specifications

### Integration Points
- **Real-time**: WebSocket for immediate trip updates and coordination
- **Database**: Transaction management for trip status changes
- **Notifications**: Push notifications to both driver and customer
- **Queue System**: BullMQ for handling timeouts and redistributions
- **Analytics**: Event tracking for acceptance rates and response times

### Security Requirements
- Atomic transaction handling for trip acceptance
- Race condition prevention for multiple drivers
- Request validation to prevent unauthorized trip acceptance
- Audit logging for all acceptance/decline actions
- Rate limiting to prevent spam accepting/declining

## Design Specifications

### Visual Layout & Components

**Trip Acceptance Modal/Interface**:
```
[Trip Acceptance Modal - Full Screen on Mobile]
├── [Header]
│   ├── Trip ID + Urgency Badge
│   ├── Countdown Timer (30s remaining)
│   └── Close/Minimize Button
│
├── [Trip Summary]
│   ├── [Route Preview Map]
│   ├── Pickup Location + Time
│   ├── Destination + Distance
│   ├── Customer Info (Rating, Name Initial)
│   └── Special Requirements/Notes
│
├── [Earnings Breakdown]
│   ├── Base Fare: ₸2,500
│   ├── Platform Fee (-15%): -₸375
│   ├── Your Earnings: ₸2,125
│   └── Estimated Duration: 45 min
│
├── [Action Buttons]
│   ├── [DECLINE] - Secondary Button
│   └── [ACCEPT TRIP] - Primary CTA
│
└── [Footer Info]
    ├── "Trip expires in 25 seconds"
    └── "Acceptance is binding"
```

**Acceptance States & Feedback**:
```
[Default State]
- Accept button: Green, prominent
- Decline button: Gray, secondary
- Timer: Orange countdown

[Processing State]
- Accept button: Loading spinner
- Decline disabled
- Overlay: "Confirming trip acceptance..."

[Success State]
- Green checkmark animation
- "Trip accepted! Navigating to pickup..."
- Auto-redirect to trip management

[Conflict State]
- Red alert: "Trip no longer available"
- "Another driver accepted this trip"
- Auto-close modal

[Timeout State]
- Amber warning: "Time expired"
- "Trip offered to other drivers"
- Return to discovery view
```

**Component Hierarchy**:
```tsx
<TripAcceptanceManager>
  <TripAcceptanceModal
    trip={currentTrip}
    isOpen={showAcceptance}
    onAccept={handleAcceptTrip}
    onDecline={handleDeclineTrip}
    onTimeout={handleTimeout}
  >
    <TripSummary trip={trip} />
    <EarningsBreakdown 
      fare={trip.fare}
      platformFee={platformFee}
      netEarnings={netEarnings}
    />
    <CountdownTimer 
      duration={30}
      onExpire={handleTimeout}
    />
    <ActionButtons 
      onAccept={handleAccept}
      onDecline={handleDecline}
      isProcessing={isProcessing}
    />
  </TripAcceptanceModal>
  
  <AcceptanceConfirmation
    isOpen={showConfirmation}
    trip={acceptedTrip}
    onNavigate={handleNavigateToPickup}
  />
</TripAcceptanceManager>
```

### Design System Compliance

**Color Palette (Acceptance Actions)**:
```css
/* Action Colors */
--accept-primary: #10b981;         /* bg-emerald-500 */
--accept-hover: #059669;           /* bg-emerald-600 */
--decline-secondary: #6b7280;      /* bg-gray-500 */
--decline-hover: #4b5563;          /* bg-gray-600 */

/* Status Colors */
--countdown-warning: #f59e0b;      /* bg-amber-500 */
--countdown-critical: #ef4444;     /* bg-red-500 */
--processing: #3b82f6;             /* bg-blue-500 */
--success: #10b981;                /* bg-emerald-500 */
--conflict: #ef4444;               /* bg-red-500 */
```

**Typography Scale**:
```css
--timer-display: 2rem;             /* text-4xl - Countdown */
--earnings-primary: 1.5rem;        /* text-2xl - Your earnings */
--trip-details: 1rem;              /* text-base - Trip info */
--action-button: 1.125rem;         /* text-lg - Button text */
```

### Responsive Behavior

**Modal Behavior**:
```css
/* Mobile (< 768px) */
.acceptance-mobile {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: white;
}

/* Tablet (768px - 1023px) */
.acceptance-tablet {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 500px;
}

/* Desktop (1024px+) */
.acceptance-desktop {
  max-width: 600px;
  margin: auto;
}
```

**Interaction Adaptations**:
```tsx
// Mobile: Full-screen modal with large touch targets
// Tablet: Centered modal with medium button sizes
// Desktop: Compact modal with standard button sizes
```

### Interaction Patterns

**Button States & Animations**:
```typescript
interface AcceptanceButtonStates {
  accept: {
    default: 'bg-emerald-500 text-white shadow-lg';
    hover: 'bg-emerald-600 shadow-xl scale-105';
    processing: 'bg-emerald-500 opacity-75 cursor-not-allowed';
    success: 'bg-emerald-600 transform scale-110';
  };
  decline: {
    default: 'bg-gray-200 text-gray-700';
    hover: 'bg-gray-300';
    disabled: 'bg-gray-100 opacity-50';
  };
}
```

**Timer Behavior**:
```typescript
interface CountdownBehavior {
  display: 'MM:SS format with color changes';
  warnings: 'Visual alerts at 10s and 5s remaining';
  expiry: 'Automatic modal close and trip redistribution';
  extension: 'Optional 15s extension for driver decision';
}
```

## Technical Architecture

### Database Schema Changes

```sql
-- Add trip acceptance tracking fields
ALTER TABLE trips ADD COLUMN acceptance_deadline TIMESTAMP;
ALTER TABLE trips ADD COLUMN offered_to_driver_id UUID REFERENCES users(id);
ALTER TABLE trips ADD COLUMN acceptance_response_time INTEGER; -- in seconds

-- Create trip_acceptance_log table
CREATE TABLE trip_acceptance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'offered', 'accepted', 'declined', 'timeout'
  offered_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_time_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trips_acceptance_deadline ON trips(acceptance_deadline) 
WHERE acceptance_deadline IS NOT NULL;
CREATE INDEX idx_trip_acceptance_log_trip_driver ON trip_acceptance_log(trip_id, driver_id);
CREATE INDEX idx_trip_acceptance_log_action_time ON trip_acceptance_log(action, offered_at);
```

### API Endpoints

```typescript
// Trip Acceptance APIs
POST /api/drivers/trips/:tripId/accept
POST /api/drivers/trips/:tripId/decline
POST /api/drivers/trips/:tripId/extend-timer (optional)
GET /api/drivers/trips/:tripId/acceptance-status

// WebSocket Events
WS /ws/drivers/trip-acceptance
// Events: 'trip-offered', 'trip-accepted', 'trip-declined', 
//         'trip-timeout', 'trip-conflict', 'timer-extended'
```

### Real-time Coordination System

**Trip Acceptance Coordinator**:
```typescript
class TripAcceptanceCoordinator {
  private redis: Redis;
  private queue: BullQueue;
  
  async offerTripToDriver(tripId: string, driverId: string): Promise<void> {
    const lockKey = `trip-lock:${tripId}`;
    const timeoutDuration = 30; // seconds
    
    // Create distributed lock to prevent race conditions
    const lock = await this.redis.set(
      lockKey, 
      driverId, 
      'EX', timeoutDuration, 
      'NX'
    );
    
    if (!lock) {
      throw new Error('Trip is already being offered to another driver');
    }
    
    // Set trip acceptance deadline
    await this.updateTripAcceptanceDeadline(tripId, timeoutDuration);
    
    // Schedule timeout job
    await this.queue.add('trip-timeout', {
      tripId,
      driverId,
      deadline: new Date(Date.now() + timeoutDuration * 1000)
    }, {
      delay: timeoutDuration * 1000,
      jobId: `timeout-${tripId}-${driverId}`
    });
    
    // Notify driver via WebSocket
    await this.notifyDriverOfTripOffer(driverId, tripId);
    
    // Log the offer
    await this.logAcceptanceAction(tripId, driverId, 'offered');
  }
  
  async acceptTrip(tripId: string, driverId: string): Promise<AcceptanceResult> {
    const lockKey = `trip-lock:${tripId}`;
    
    // Check if driver still has the lock
    const currentLockHolder = await this.redis.get(lockKey);
    if (currentLockHolder !== driverId) {
      return {
        success: false,
        reason: 'Trip no longer available or expired'
      };
    }
    
    // Begin database transaction
    const result = await this.db.transaction(async (tx) => {
      // Update trip status atomically
      const updatedTrip = await tx.query(`
        UPDATE trips 
        SET status = 'accepted', 
            driver_id = $1,
            accepted_at = NOW(),
            offered_to_driver_id = NULL,
            acceptance_deadline = NULL
        WHERE id = $2 AND status = 'pending'
        RETURNING *
      `, [driverId, tripId]);
      
      if (updatedTrip.rows.length === 0) {
        throw new Error('Trip not available for acceptance');
      }
      
      // Log the acceptance
      await this.logAcceptanceAction(tripId, driverId, 'accepted');
      
      return updatedTrip.rows[0];
    });
    
    // Release the lock
    await this.redis.del(lockKey);
    
    // Cancel timeout job
    await this.queue.removeJobs(`timeout-${tripId}-${driverId}`);
    
    // Notify customer and other drivers
    await this.notifyTripAccepted(tripId, driverId);
    
    return {
      success: true,
      trip: result
    };
  }
  
  async declineTrip(tripId: string, driverId: string): Promise<void> {
    const lockKey = `trip-lock:${tripId}`;
    
    // Release the lock
    await this.redis.del(lockKey);
    
    // Cancel timeout job
    await this.queue.removeJobs(`timeout-${tripId}-${driverId}`);
    
    // Log the decline
    await this.logAcceptanceAction(tripId, driverId, 'declined');
    
    // Reset trip for re-offering
    await this.resetTripForReoffering(tripId);
    
    // Offer to next available driver
    await this.offerToNextDriver(tripId);
  }
  
  async handleTimeout(tripId: string, driverId: string): Promise<void> {
    const lockKey = `trip-lock:${tripId}`;
    
    // Check if lock still exists (not already processed)
    const lockExists = await this.redis.exists(lockKey);
    if (!lockExists) return;
    
    // Release the lock
    await this.redis.del(lockKey);
    
    // Log the timeout
    await this.logAcceptanceAction(tripId, driverId, 'timeout');
    
    // Notify driver of timeout
    await this.notifyDriverOfTimeout(driverId, tripId);
    
    // Reset trip and offer to next driver
    await this.resetTripForReoffering(tripId);
    await this.offerToNextDriver(tripId);
  }
}
```

### Component Implementation

**TripAcceptanceModal**:
```typescript
interface TripAcceptanceModalProps {
  trip: Trip;
  isOpen: boolean;
  onAccept: (tripId: string) => Promise<void>;
  onDecline: (tripId: string) => void;
  onTimeout: () => void;
}

const TripAcceptanceModal: React.FC<TripAcceptanceModalProps> = ({
  trip,
  isOpen,
  onAccept,
  onDecline,
  onTimeout
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [hasExpired, setHasExpired] = useState(false);
  
  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || hasExpired) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setHasExpired(true);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, hasExpired, onTimeout]);
  
  // Auto-close on expiry
  useEffect(() => {
    if (hasExpired) {
      setTimeout(() => {
        onTimeout();
      }, 2000);
    }
  }, [hasExpired]);
  
  const handleAccept = async () => {
    if (isProcessing || hasExpired) return;
    
    setIsProcessing(true);
    try {
      await onAccept(trip.id);
      toast.success('Trip accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept trip. Please try again.');
      setIsProcessing(false);
    }
  };
  
  const handleDecline = () => {
    if (isProcessing || hasExpired) return;
    onDecline(trip.id);
  };
  
  const platformFee = trip.fare * 0.15;
  const netEarnings = trip.fare - platformFee;
  const timerColor = timeRemaining <= 5 ? 'text-red-500' : 
                   timeRemaining <= 10 ? 'text-amber-500' : 'text-green-500';
  
  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="lg" className="trip-acceptance-modal">
      <ModalHeader className="text-center">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Trip Request</Badge>
          <div className={`text-2xl font-bold ${timerColor}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </ModalHeader>
      
      <ModalContent className="space-y-6">
        {/* Trip Route Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="font-medium">{trip.pickup_address}</p>
                <p className="text-sm text-gray-500">
                  Pickup • {formatTime(trip.pickup_time)}
                </p>
              </div>
            </div>
            
            <div className="ml-6 border-l-2 border-gray-300 h-6" />
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div>
                <p className="font-medium">{trip.destination_address}</p>
                <p className="text-sm text-gray-500">
                  {trip.distance_km} km • {trip.estimated_duration} min
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer Info */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Avatar>
            <AvatarFallback>{trip.customer_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{trip.customer_name}</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{trip.customer_rating}</span>
              <span className="text-sm text-gray-500">
                • {trip.passengers} passenger{trip.passengers > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        
        {/* Earnings Breakdown */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Earnings Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Fare</span>
              <span>₸{trip.fare}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Platform Fee (-15%)</span>
              <span>-₸{platformFee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg text-emerald-600">
              <span>Your Earnings</span>
              <span>₸{netEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Special Requirements */}
        {trip.special_requirements && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Special Requirements</AlertTitle>
            <AlertDescription>{trip.special_requirements}</AlertDescription>
          </Alert>
        )}
      </ModalContent>
      
      <ModalFooter className="gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleDecline}
          disabled={isProcessing || hasExpired}
          className="flex-1"
        >
          Decline
        </Button>
        
        <Button
          size="lg"
          onClick={handleAccept}
          disabled={isProcessing || hasExpired}
          className="flex-2 bg-emerald-500 hover:bg-emerald-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Accepting...
            </>
          ) : hasExpired ? (
            'Expired'
          ) : (
            'Accept Trip'
          )}
        </Button>
      </ModalFooter>
      
      {hasExpired && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg text-center">
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Time Expired</h3>
            <p className="text-gray-600">This trip has been offered to other drivers</p>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

## Implementation Steps

### Phase 1: Core Acceptance Logic (Week 1)
1. **Backend Coordination**
   - Implement trip acceptance coordinator with Redis locks
   - Create timeout handling with BullMQ
   - Set up WebSocket event system for real-time updates

2. **Database Schema**
   - Add acceptance tracking fields to trips table
   - Create acceptance log table for analytics
   - Set up indexes for performance optimization

3. **API Endpoints**
   - Accept/decline trip endpoints with validation
   - Acceptance status checking
   - Timeout and extension handling

### Phase 2: Real-time Interface (Week 2)
1. **Frontend Components**
   - Trip acceptance modal with countdown timer
   - Real-time state management
   - Success/error feedback systems

2. **WebSocket Integration**
   - Client-side real-time updates
   - Conflict resolution handling
   - Connection state management

3. **User Experience**
   - Smooth animations and transitions
   - Mobile-optimized touch interactions
   - Error recovery mechanisms

### Phase 3: Advanced Features (Week 3)
1. **Performance Optimization**
   - Database query optimization
   - Caching strategies for trip data
   - Mobile performance improvements

2. **Analytics & Monitoring**
   - Acceptance rate tracking
   - Response time analytics
   - Conflict resolution metrics

3. **Testing & Validation**
   - Race condition testing
   - Load testing for concurrent acceptances
   - Mobile device testing

## Testing Strategy

### Unit Tests
```typescript
describe('Trip Acceptance', () => {
  test('should accept trip successfully with valid driver');
  test('should prevent double acceptance by different drivers');
  test('should handle timeout correctly');
  test('should decline trip and redistribute to other drivers');
});
```

### Integration Tests
```typescript
describe('Acceptance Coordination', () => {
  test('concurrent acceptance attempts');
  test('timeout and redistribution workflow');
  test('WebSocket notification delivery');
  test('database consistency under load');
});
```

### Performance Tests
- Concurrent acceptance stress testing
- WebSocket connection limits
- Mobile network reliability
- Database lock performance

## Dependencies

### External Services
- Redis (distributed locking and caching)
- WebSocket service (Socket.io/native WebSocket)
- Push notification service
- Queue system (BullMQ)

### Internal Dependencies
- Trip discovery system
- Driver authentication
- Customer notification system
- Payment processing trigger

## Risks & Mitigation

### Technical Risks
- **Race conditions**: Implement distributed locks with Redis
- **WebSocket disconnections**: Add connection retry logic
- **Database deadlocks**: Optimize transaction isolation levels

### Business Risks
- **Driver response fatigue**: Implement smart trip offering
- **Customer wait times**: Optimize timeout durations
- **Acceptance rate decline**: Add driver incentives

## Success Metrics

### Performance KPIs
- Trip acceptance response time < 15 seconds average
- Conflict resolution success rate > 99%
- WebSocket message delivery < 100ms
- Zero double-booking incidents

### Business KPIs
- Driver acceptance rate > 75%
- Average decision time < 20 seconds
- Customer satisfaction with pickup timing > 90%
- Trip redistribution efficiency > 95%
