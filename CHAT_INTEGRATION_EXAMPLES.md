# Chat Integration Examples

This document provides practical examples of integrating the chat feature into different parts of the StepperGO application.

## Example 1: Trip Details Page Integration

```tsx
// src/app/trips/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TripChatButton } from '@/components/chat';

export default function TripDetailPage() {
  const params = useParams();
  const [trip, setTrip] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState('');
  
  // Check if user has access to chat
  const hasAccess = trip && user && (
    trip.driverId === user.id || // User is driver
    trip.organizerId === user.id || // User is organizer
    trip.bookings?.some(b => b.userId === user.id) // User has booking
  );

  return (
    <div className="min-h-screen">
      {/* Your existing trip details UI */}
      
      {/* Add the chat button */}
      {hasAccess && (
        <TripChatButton
          tripId={trip.id}
          tripTitle={trip.title}
          currentUserId={user.id}
          token={sessionToken}
          hasAccess={hasAccess}
        />
      )}
    </div>
  );
}
```

## Example 2: Driver Dashboard Integration

```tsx
// src/app/driver/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat';

export default function DriverDashboard() {
  const [driver, setDriver] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [sessionToken, setSessionToken] = useState('');
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dashboard content */}
      <div className="lg:col-span-2">
        {/* Your existing dashboard UI */}
      </div>

      {/* Chat sidebar */}
      {activeTrip && (
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Trip Chat</h3>
            <div className="h-[600px]">
              <ChatInterface
                tripId={activeTrip.id}
                currentUserId={driver.userId}
                token={sessionToken}
                tripTitle={activeTrip.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Example 3: Booking Confirmation Page

```tsx
// src/app/bookings/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TripChatButton } from '@/components/chat';

export default function BookingDetailPage() {
  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Booking Confirmed!</h1>
        
        {/* Booking details */}
        <div className="space-y-4">
          {/* Your booking details UI */}
        </div>

        {/* Chat with driver */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            💬 Chat with your driver
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Have questions about pickup location or timing? Chat directly with your driver.
          </p>
          
          {/* Inline chat button */}
          <TripChatButton
            tripId={booking.tripId}
            tripTitle={booking.trip.title}
            currentUserId={user.id}
            token={sessionToken}
            hasAccess={true}
          />
        </div>
      </div>
    </div>
  );
}
```

## Example 4: Custom Chat Button

If you want to create your own chat trigger instead of using TripChatButton:

```tsx
'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat';
import { ChatNotificationBadge } from '@/components/chat';

export function CustomChatButton({ tripId, userId, token, unreadCount }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Custom button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative btn btn-primary"
      >
        <span>Message Driver</span>
        {unreadCount > 0 && (
          <ChatNotificationBadge count={unreadCount} className="absolute -top-2 -right-2" />
        )}
      </button>

      {/* Chat modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh]">
            <ChatInterface
              tripId={tripId}
              currentUserId={userId}
              token={token}
              tripTitle="Trip Chat"
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

## Example 5: Fetching Unread Count

```tsx
'use client';

import { useEffect, useState } from 'react';

export function useUnreadMessageCount(tripId: string, token: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId || !token) return;

    async function fetchUnreadCount() {
      try {
        const response = await fetch(`/api/messages/${tripId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.data.unreadCount || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [tripId, token]);

  return { unreadCount, loading };
}

// Usage
export function TripCard({ trip, userId, token }) {
  const { unreadCount } = useUnreadMessageCount(trip.id, token);

  return (
    <div className="trip-card">
      {/* Your trip card UI */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-blue-600">
          <span className="text-sm font-medium">
            {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
```

## Example 6: Authentication Helper

```tsx
// src/lib/auth/getSessionToken.ts
'use client';

import { cookies } from 'next/headers';

export function getSessionTokenClient(): string | null {
  // In client components, read from cookie or localStorage
  if (typeof window !== 'undefined') {
    // Try localStorage first
    const token = localStorage.getItem('session_token');
    if (token) return token;
    
    // Try cookie
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('session='))
      ?.split('=')[1];
    
    return cookieToken || null;
  }
  return null;
}

// Usage in component
export function MyComponent() {
  const sessionToken = getSessionTokenClient();
  
  if (!sessionToken) {
    return <div>Please log in to use chat</div>;
  }
  
  return (
    <TripChatButton
      // ... props
      token={sessionToken}
    />
  );
}
```

## Example 7: Admin Moderation Interface

```tsx
// src/app/admin/messages/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AdminMessagesPage() {
  const [reportedMessages, setReportedMessages] = useState([]);

  useEffect(() => {
    // Fetch reported messages
    fetch('/api/admin/messages/reported', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    })
      .then(res => res.json())
      .then(data => setReportedMessages(data.messages));
  }, []);

  const handleHideMessage = async (messageId: string) => {
    await fetch(`/api/admin/messages/${messageId}/hide`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    // Refresh list
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reported Messages</h1>
      
      <div className="space-y-4">
        {reportedMessages.map((message) => (
          <div key={message.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{message.sender.name}</p>
                <p className="text-gray-600 mt-2">{message.content}</p>
                <p className="text-sm text-red-600 mt-2">
                  Reported for: {message.reportReason}
                </p>
              </div>
              <button
                onClick={() => handleHideMessage(message.id)}
                className="btn btn-danger"
              >
                Hide Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Tips & Best Practices

### 1. Session Token Management
Always ensure session tokens are:
- Stored securely (httpOnly cookies preferred)
- Not exposed in URLs or logs
- Refreshed before expiration
- Cleared on logout

### 2. Error Handling
```tsx
const { error, isConnected } = useSocketChat({ ... });

if (error) {
  return (
    <div className="text-red-600">
      Failed to connect to chat: {error}
      <button onClick={retryConnection}>Retry</button>
    </div>
  );
}
```

### 3. Loading States
```tsx
if (isLoadingHistory) {
  return <ChatSkeleton />;
}
```

### 4. Mobile Responsive
The chat components are mobile-responsive by default. For custom implementations:

```tsx
<div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px]">
  <ChatInterface ... />
</div>
```

### 5. Accessibility
Ensure chat has proper ARIA labels:

```tsx
<button aria-label="Open chat" aria-describedby="unread-count">
  <span id="unread-count" className="sr-only">
    {unreadCount} unread messages
  </span>
</button>
```

## Testing

### Manual Testing Checklist
- [ ] Open chat on trip page as driver
- [ ] Open chat on trip page as passenger
- [ ] Send messages from both sides
- [ ] Verify typing indicators appear
- [ ] Check read receipts update
- [ ] Test with network throttling
- [ ] Test reconnection after offline
- [ ] Verify unread counts update
- [ ] Test on mobile devices
- [ ] Test with multiple trips

### Integration Test Example
```typescript
// tests/chat.integration.test.ts
describe('Chat Integration', () => {
  it('should allow driver and passenger to chat', async () => {
    // Setup driver and passenger users
    // Create trip and booking
    // Open chat on both sides
    // Send message from driver
    // Verify passenger receives message
    // Send reply from passenger
    // Verify driver receives reply
  });
});
```

## Troubleshooting

### Chat not connecting
1. Check session token is valid
2. Verify WebSocket server is running
3. Check browser console for errors
4. Ensure CORS is configured correctly

### Messages not appearing
1. Check user has access to trip
2. Verify conversation was created
3. Check network tab for WebSocket messages
4. Ensure both users are in same conversation

### Unread count not updating
1. Check polling interval
2. Verify API endpoint returns correct count
3. Check for JavaScript errors
4. Ensure token is valid

For more help, see `CHAT_FEATURE_DOCUMENTATION.md`
