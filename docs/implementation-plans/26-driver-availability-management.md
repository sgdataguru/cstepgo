# 26 Driver Availability Management - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to control my online/offline status and set availability preferences, so that I only receive trip requests when I'm ready to drive and in my preferred service area.

## Technical Specifications

### Database Schema
```sql
-- Create driver_availability table
CREATE TABLE driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN DEFAULT false,
  service_radius_km INTEGER DEFAULT 10,
  max_passengers INTEGER DEFAULT 4,
  accepts_shared_trips BOOLEAN DEFAULT true,
  accepts_long_distance BOOLEAN DEFAULT true,
  break_until TIMESTAMP,
  auto_offline_at TIMESTAMP,
  last_location_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create driver_schedule table for planned availability
CREATE TABLE driver_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints
```typescript
// Availability Management APIs
POST /api/drivers/availability/online
POST /api/drivers/availability/offline
PUT /api/drivers/availability/preferences
GET /api/drivers/availability/status
POST /api/drivers/availability/break

// Schedule Management APIs
GET /api/drivers/schedule
POST /api/drivers/schedule
PUT /api/drivers/schedule/:id
DELETE /api/drivers/schedule/:id
```

### Component Implementation
```typescript
const DriverAvailabilityControls: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [preferences, setPreferences] = useState<AvailabilityPreferences>({
    serviceRadius: 10,
    maxPassengers: 4,
    acceptsShared: true,
    acceptsLongDistance: true
  });
  const [isOnBreak, setIsOnBreak] = useState(false);
  
  const toggleOnlineStatus = async () => {
    try {
      const endpoint = isOnline ? '/api/drivers/availability/offline' : '/api/drivers/availability/online';
      await fetch(endpoint, { method: 'POST' });
      setIsOnline(!isOnline);
      
      if (!isOnline) {
        // Start location tracking when going online
        startLocationTracking();
      } else {
        // Stop location tracking when going offline
        stopLocationTracking();
      }
    } catch (error) {
      toast.error('Failed to update availability status');
    }
  };
  
  const takeBreak = async (duration: number) => {
    try {
      await fetch('/api/drivers/availability/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration })
      });
      setIsOnBreak(true);
      setTimeout(() => setIsOnBreak(false), duration * 60 * 1000);
    } catch (error) {
      toast.error('Failed to set break time');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Availability Status</CardTitle>
          <Badge variant={isOnline ? "success" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Online/Offline Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Driver Status</h3>
            <p className="text-sm text-gray-600">
              {isOnline ? "Receiving trip requests" : "Not available for trips"}
            </p>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnlineStatus}
            size="lg"
          />
        </div>
        
        {/* Service Preferences */}
        <Separator />
        
        <div className="space-y-4">
          <h3 className="font-medium">Service Preferences</h3>
          
          <div className="space-y-3">
            <div>
              <Label>Service Radius: {preferences.serviceRadius} km</Label>
              <Slider
                value={[preferences.serviceRadius]}
                onValueChange={([value]) => 
                  setPreferences(prev => ({ ...prev, serviceRadius: value }))
                }
                min={5}
                max={25}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Maximum Passengers</Label>
              <Select
                value={preferences.maxPassengers.toString()}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, maxPassengers: parseInt(value) }))
                }
              >
                <SelectContent>
                  <SelectItem value="1">1 Passenger</SelectItem>
                  <SelectItem value="2">2 Passengers</SelectItem>
                  <SelectItem value="4">4 Passengers</SelectItem>
                  <SelectItem value="6">6 Passengers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Accept Shared Trips</Label>
              <Switch
                checked={preferences.acceptsShared}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, acceptsShared: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Accept Long Distance (25km+)</Label>
              <Switch
                checked={preferences.acceptsLongDistance}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, acceptsLongDistance: checked }))
                }
              />
            </div>
          </div>
        </div>
        
        {/* Quick Break Options */}
        {isOnline && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium">Take a Break</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => takeBreak(15)}
                  disabled={isOnBreak}
                >
                  15 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => takeBreak(30)}
                  disabled={isOnBreak}
                >
                  30 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => takeBreak(60)}
                  disabled={isOnBreak}
                >
                  1 hour
                </Button>
              </div>
              {isOnBreak && (
                <p className="text-sm text-amber-600">
                  On break - not receiving trip requests
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

## Implementation Steps

### Phase 1: Core Status Management (Week 1)
1. **Backend Infrastructure**
   - Availability status tracking
   - Location-based service radius implementation
   - Preference management system

2. **Frontend Controls**
   - Online/offline toggle interface
   - Preference configuration panel
   - Break time management

### Phase 2: Advanced Preferences (Week 2)
1. **Service Customization**
   - Trip type preferences (shared, private, long-distance)
   - Vehicle capacity settings
   - Service area visualization

2. **Schedule Management**
   - Planned availability scheduling
   - Automatic online/offline switching
   - Recurring schedule patterns

### Phase 3: Optimization & Analytics (Week 3)
1. **Smart Features**
   - Auto-offline during inactivity
   - Optimal service radius suggestions
   - Availability pattern analytics

2. **User Experience**
   - Quick status change shortcuts
   - Preference memory and suggestions
   - Performance impact monitoring

## Success Metrics
- Driver online time utilization > 70%
- Preference configuration completion rate > 90%
- Average service radius optimization increase of 15%
- Break time feature adoption > 60%
