# 27 Driver Trip Status Updates - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to update trip status throughout the journey (pickup, in-transit, completed), so that customers are informed of progress and the platform can track trip lifecycle.

## Technical Specifications

### Database Schema
```sql
-- Add status tracking to trips table
ALTER TABLE trips ADD COLUMN current_status VARCHAR(20) DEFAULT 'accepted';
ALTER TABLE trips ADD COLUMN driver_arrived_pickup_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN passenger_picked_up_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN trip_started_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN driver_arrived_destination_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN trip_completed_at TIMESTAMP;

-- Create trip_status_log table for detailed tracking
CREATE TABLE trip_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  updated_by UUID REFERENCES users(id),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  verification_photo_url VARCHAR(500),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create photo verification table
CREATE TABLE trip_verification_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  photo_type VARCHAR(30), -- 'pickup_location', 'passenger_pickup', 'destination_arrival'
  photo_url VARCHAR(500) NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Component Implementation
```typescript
const TripStatusController: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  
  const statusFlow = [
    { key: 'accepted', label: 'Trip Accepted', icon: CheckCircle, color: 'blue' },
    { key: 'en_route_pickup', label: 'On the Way', icon: Navigation, color: 'amber' },
    { key: 'arrived_pickup', label: 'Arrived at Pickup', icon: MapPin, color: 'orange' },
    { key: 'passenger_picked_up', label: 'Passenger Picked Up', icon: Users, color: 'green' },
    { key: 'en_route_destination', label: 'En Route to Destination', icon: ArrowRight, color: 'blue' },
    { key: 'arrived_destination', label: 'Arrived at Destination', icon: Flag, color: 'purple' },
    { key: 'completed', label: 'Trip Completed', icon: Check, color: 'emerald' }
  ];
  
  const updateTripStatus = async (newStatus: string, requiresPhoto = false) => {
    if (requiresPhoto) {
      setShowPhotoCapture(true);
      return;
    }
    
    setIsUpdating(true);
    try {
      await fetch(`/api/trips/${tripId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          location: currentLocation,
          timestamp: new Date().toISOString()
        })
      });
      
      // Update local state
      setTrip(prev => prev ? { ...prev, current_status: newStatus } : null);
      
      // Send notification to customer
      await notifyCustomerOfStatusUpdate(newStatus);
      
      toast.success(getStatusUpdateMessage(newStatus));
    } catch (error) {
      toast.error('Failed to update trip status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const captureVerificationPhoto = async (photoType: string) => {
    try {
      const photo = await capturePhoto();
      await uploadVerificationPhoto(tripId, photoType, photo, currentLocation);
      setShowPhotoCapture(false);
      
      // Proceed with status update after photo upload
      await updateTripStatus(getNextStatus(trip?.current_status));
    } catch (error) {
      toast.error('Failed to capture verification photo');
    }
  };
  
  const getNextStatus = (currentStatus: string | undefined): string => {
    const currentIndex = statusFlow.findIndex(s => s.key === currentStatus);
    return currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1].key 
      : currentStatus || 'accepted';
  };
  
  const getAvailableActions = () => {
    switch (trip?.current_status) {
      case 'accepted':
        return [
          { 
            label: 'I\'m on my way', 
            status: 'en_route_pickup',
            icon: Navigation,
            color: 'bg-blue-500'
          }
        ];
      
      case 'en_route_pickup':
        return [
          { 
            label: 'Arrived at pickup', 
            status: 'arrived_pickup',
            icon: MapPin,
            color: 'bg-orange-500',
            requiresPhoto: true
          }
        ];
      
      case 'arrived_pickup':
        return [
          { 
            label: 'Passenger picked up', 
            status: 'passenger_picked_up',
            icon: Users,
            color: 'bg-green-500',
            requiresPhoto: true
          }
        ];
      
      case 'passenger_picked_up':
        return [
          { 
            label: 'Start trip', 
            status: 'en_route_destination',
            icon: ArrowRight,
            color: 'bg-blue-500'
          }
        ];
      
      case 'en_route_destination':
        return [
          { 
            label: 'Arrived at destination', 
            status: 'arrived_destination',
            icon: Flag,
            color: 'bg-purple-500'
          }
        ];
      
      case 'arrived_destination':
        return [
          { 
            label: 'Complete trip', 
            status: 'completed',
            icon: Check,
            color: 'bg-emerald-500',
            requiresPhoto: true
          }
        ];
      
      default:
        return [];
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Trip Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Timeline */}
        <div className="space-y-4">
          {statusFlow.map((status, index) => {
            const isActive = trip?.current_status === status.key;
            const isCompleted = statusFlow.findIndex(s => s.key === trip?.current_status) > index;
            const IconComponent = status.icon;
            
            return (
              <div
                key={status.key}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200'
                }`}
              >
                <IconComponent 
                  className={`w-6 h-6 ${
                    isActive 
                      ? 'text-blue-500' 
                      : isCompleted 
                        ? 'text-green-500' 
                        : 'text-gray-400'
                  }`} 
                />
                <div className="flex-1">
                  <p className={`font-medium ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </p>
                  {isActive && (
                    <p className="text-sm text-blue-600">Current status</p>
                  )}
                  {isCompleted && (
                    <p className="text-sm text-green-600">
                      ✓ Completed at {getStatusTimestamp(status.key)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <h3 className="font-medium">Next Actions</h3>
          <div className="grid gap-2">
            {getAvailableActions().map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.status}
                  onClick={() => updateTripStatus(action.status, action.requiresPhoto)}
                  disabled={isUpdating}
                  className={`${action.color} hover:opacity-90 text-white justify-start gap-3 h-12`}
                >
                  <IconComponent className="w-5 h-5" />
                  {isUpdating ? 'Updating...' : action.label}
                  {action.requiresPhoto && (
                    <Camera className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Customer Communication */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openCustomerChat()}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message Customer
          </Button>
        </div>
      </CardContent>
      
      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCaptureModal
          isOpen={showPhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
          onCapture={captureVerificationPhoto}
          photoType={getPhotoTypeForStatus(trip?.current_status)}
        />
      )}
    </Card>
  );
};

// Photo Capture Component
const PhotoCaptureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoType: string) => Promise<void>;
  photoType: string;
}> = ({ isOpen, onClose, onCapture, photoType }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  
  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      await onCapture(photoType);
    } finally {
      setIsCapturing(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Verification Photo</ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <div className="text-center space-y-4">
          <Camera className="w-16 h-16 text-gray-400 mx-auto" />
          <div>
            <h3 className="font-medium">Photo Required</h3>
            <p className="text-sm text-gray-600">
              {getPhotoInstructions(photoType)}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCapturing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
```

## Implementation Steps

### Phase 1: Core Status Updates (Week 1)
1. **Backend Status Management**
   - Trip status tracking system
   - Status validation and workflow
   - Customer notification triggers

2. **Frontend Status Interface**
   - Status update buttons and controls
   - Progress timeline visualization
   - Real-time status synchronization

### Phase 2: Verification Features (Week 2)
1. **Photo Verification**
   - Camera integration for verification photos
   - Photo upload and storage system
   - Location-stamped photo verification

2. **Enhanced Tracking**
   - Detailed status logging
   - GPS location recording with status updates
   - Status history and audit trail

### Phase 3: Customer Communication (Week 3)
1. **Notification System**
   - Automatic customer notifications for status changes
   - Real-time progress updates
   - ETA calculations and updates

2. **Quality Assurance**
   - Status validation rules
   - Error handling and recovery
   - Analytics and reporting

## Success Metrics
- Status update completion rate > 95%
- Customer notification delivery < 10 seconds
- Photo verification success rate > 90%
- Trip completion accuracy 100%
