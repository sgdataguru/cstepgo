# 24 Real-Time Driver-Customer Communication - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to communicate with customers during trips through in-app chat, so that I can coordinate pickup details and provide excellent customer service.

## Pre-conditions

- Trip acceptance system is functional
- Driver and customer authentication exists
- Real-time infrastructure (WebSocket) is available
- Trip lifecycle management is implemented

## Business Requirements

- Real-time messaging between driver and customer during active trips
- Pre-defined quick messages for common scenarios
- Message history preservation for support purposes
- Emergency contact integration with platform safety features
- Read receipts and delivery confirmations
- Media sharing capability (photos for pickup verification)

## Technical Specifications

### Integration Points
- **Real-time**: Socket.io for instant message delivery
- **File Storage**: AWS S3/Cloudinary for image/media sharing
- **Push Notifications**: Firebase/OneSignal for offline message alerts
- **Emergency Services**: Integration with emergency contact system
- **Translation**: Optional Google Translate API for multi-language support

### Security Requirements
- End-to-end message encryption for privacy
- Message content moderation and filtering
- Trip-scoped access control (only active trip participants)
- Audit logging for safety and dispute resolution
- Data retention policies compliant with privacy laws

## Design Specifications

### Visual Layout & Components

**In-Trip Chat Interface**:
```
[Chat Header - Sticky]
├── Customer Avatar + Name + Rating
├── Trip Status Badge (Pickup/In Transit/Arriving)
├── Emergency Button (Red, Prominent)
└── Call Customer Button

[Messages Area - Scrollable]
├── [System Message] "Trip started - Stay safe!"
├── [Driver Message] "On my way to pickup location"
├── [Customer Message] "I'll be wearing a blue jacket"
├── [Quick Message] "Arrived at pickup location" ✓✓
└── [Media Message] Photo + "Here's my location"

[Input Area - Sticky Bottom]
├── [Quick Messages Row]
│   ├── "I'm here" | "Running 5 min late"
│   ├── "Arrived" | "Can't find you"
│   └── "On the way" | "Trip complete"
├── [Message Input]
│   ├── Text Input Field
│   ├── Emoji Button
│   ├── Camera Button (for photos)
│   └── Send Button
└── [Emergency Strip] "Need help? Emergency contact"
```

**Component Hierarchy**:
```tsx
<TripCommunication tripId={tripId}>
  <ChatHeader>
    <CustomerInfo />
    <TripStatus />
    <EmergencyButton />
    <CallButton />
  </ChatHeader>
  
  <MessagesContainer>
    <MessageList>
      {messages.map(msg => (
        <MessageBubble 
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === driverId}
        />
      ))}
    </MessageList>
    <TypingIndicator />
  </MessagesContainer>
  
  <MessageInput>
    <QuickMessages />
    <TextInput />
    <MediaUpload />
    <SendButton />
  </MessageInput>
</TripCommunication>
```

## Technical Architecture

### Database Schema

```sql
-- Create trip_messages table
CREATE TABLE trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'driver', 'customer', 'system'
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'quick', 'system'
  content TEXT,
  media_url VARCHAR(500),
  quick_message_template VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('driver', 'customer', 'system'))
);

-- Create message_templates table for quick messages
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(50) UNIQUE NOT NULL,
  message_text TEXT NOT NULL,
  category VARCHAR(30), -- 'pickup', 'navigation', 'completion', 'emergency'
  language_code VARCHAR(5) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_trip_messages_trip_created ON trip_messages(trip_id, created_at);
CREATE INDEX idx_trip_messages_sender ON trip_messages(sender_id, sender_type);
CREATE INDEX idx_message_templates_category ON message_templates(category, is_active);

-- Insert default quick message templates
INSERT INTO message_templates (template_key, message_text, category) VALUES
('driver_on_way', 'I''m on my way to pick you up!', 'pickup'),
('driver_arrived', 'I''ve arrived at the pickup location', 'pickup'),
('driver_late', 'Running 5 minutes late, sorry for the delay', 'pickup'),
('driver_cant_find', 'Having trouble finding you, can you help?', 'pickup'),
('driver_trip_started', 'Trip started! Enjoy the ride', 'navigation'),
('driver_traffic', 'There''s some traffic ahead, might be a few extra minutes', 'navigation'),
('driver_arriving', 'We''re almost at your destination', 'completion'),
('driver_trip_complete', 'Trip completed! Thank you for riding with StepperGO', 'completion'),
('emergency_help', 'This is an emergency situation, please contact support', 'emergency');
```

### API Endpoints

```typescript
// Chat APIs
GET /api/trips/:tripId/messages
POST /api/trips/:tripId/messages
POST /api/trips/:tripId/messages/quick
POST /api/trips/:tripId/messages/media
PUT /api/trips/:tripId/messages/:messageId/read

// Quick message templates
GET /api/messages/templates?category=pickup
POST /api/messages/templates/use

// Emergency communication
POST /api/trips/:tripId/emergency
POST /api/trips/:tripId/call-customer

// WebSocket Events
WS /ws/trips/:tripId/chat
// Events: 'message', 'typing', 'read', 'media_uploaded'
```

### Real-time Communication System

```typescript
// Chat Service Implementation
class TripChatService {
  private io: SocketIO.Server;
  private redis: Redis;
  
  constructor(io: SocketIO.Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
  }
  
  async joinTripChat(socket: Socket, tripId: string, userId: string, userType: 'driver' | 'customer') {
    // Verify user has access to this trip
    const hasAccess = await this.verifyTripAccess(tripId, userId, userType);
    if (!hasAccess) {
      socket.emit('error', { message: 'Unauthorized access to trip chat' });
      return;
    }
    
    // Join trip-specific room
    const roomName = `trip-${tripId}`;
    socket.join(roomName);
    
    // Load recent messages
    const recentMessages = await this.getRecentMessages(tripId, 50);
    socket.emit('messages-history', recentMessages);
    
    // Store user socket mapping
    await this.redis.setex(`socket:${userId}:${tripId}`, 3600, socket.id);
    
    // Notify other party user is online
    socket.to(roomName).emit('user-online', { userId, userType });
  }
  
  async sendMessage(
    tripId: string, 
    senderId: string, 
    senderType: 'driver' | 'customer', 
    content: string,
    messageType: 'text' | 'image' | 'quick' = 'text'
  ) {
    // Store message in database
    const message = await this.db.query(`
      INSERT INTO trip_messages (trip_id, sender_id, sender_type, content, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [tripId, senderId, senderType, content, messageType]);
    
    const savedMessage = message.rows[0];
    
    // Broadcast to trip participants
    this.io.to(`trip-${tripId}`).emit('new-message', {
      ...savedMessage,
      senderName: await this.getSenderName(senderId),
      timestamp: savedMessage.created_at
    });
    
    // Send push notification to offline users
    await this.sendPushNotificationIfOffline(tripId, senderId, content);
    
    return savedMessage;
  }
  
  async sendQuickMessage(tripId: string, senderId: string, templateKey: string) {
    // Get template message
    const template = await this.db.query(`
      SELECT message_text FROM message_templates 
      WHERE template_key = $1 AND is_active = true
    `, [templateKey]);
    
    if (template.rows.length === 0) {
      throw new Error('Invalid message template');
    }
    
    const messageText = template.rows[0].message_text;
    
    return await this.sendMessage(tripId, senderId, 'driver', messageText, 'quick');
  }
  
  async markMessageAsRead(messageId: string, userId: string) {
    await this.db.query(`
      UPDATE trip_messages 
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND sender_id != $2
    `, [messageId, userId]);
    
    // Emit read receipt
    const message = await this.getMessageById(messageId);
    this.io.to(`trip-${message.trip_id}`).emit('message-read', {
      messageId,
      readBy: userId,
      readAt: new Date()
    });
  }
  
  async handleEmergency(tripId: string, reporterId: string, reporterType: string) {
    // Log emergency in database
    await this.db.query(`
      INSERT INTO trip_emergencies (trip_id, reporter_id, reporter_type, reported_at)
      VALUES ($1, $2, $3, NOW())
    `, [tripId, reporterId, reporterType]);
    
    // Send emergency message to chat
    await this.sendMessage(
      tripId, 
      'system', 
      'system', 
      'Emergency reported. Support has been notified and will contact you shortly.',
      'system'
    );
    
    // Notify emergency response team
    await this.notifyEmergencyTeam(tripId, reporterId, reporterType);
    
    // Broadcast emergency status to trip participants
    this.io.to(`trip-${tripId}`).emit('emergency-declared', {
      tripId,
      reporterId,
      timestamp: new Date()
    });
  }
}
```

### Component Implementation

**TripChatInterface**:
```typescript
interface TripChatProps {
  tripId: string;
  currentUserId: string;
  userType: 'driver' | 'customer';
}

const TripChatInterface: React.FC<TripChatProps> = ({
  tripId,
  currentUserId,
  userType
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [otherPartyOnline, setOtherPartyOnline] = useState(false);
  const socketRef = useRef<Socket>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/trips/${tripId}/chat`, {
      auth: {
        userId: currentUserId,
        userType: userType,
        tripId: tripId
      }
    });
    
    socketRef.current = socket;
    
    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      toast.success('Chat connected');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      toast.warning('Chat disconnected');
    });
    
    // Message events
    socket.on('messages-history', (historyMessages: ChatMessage[]) => {
      setMessages(historyMessages.reverse());
    });
    
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      if (message.sender_id !== currentUserId) {
        // Mark as read if chat is visible
        markAsRead(message.id);
      }
    });
    
    socket.on('user-online', ({ userId, userType: onlineUserType }) => {
      if (userId !== currentUserId) {
        setOtherPartyOnline(true);
      }
    });
    
    socket.on('user-offline', ({ userId }) => {
      if (userId !== currentUserId) {
        setOtherPartyOnline(false);
      }
    });
    
    socket.on('typing', ({ userId }) => {
      if (userId !== currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    socket.on('message-read', ({ messageId, readBy }) => {
      if (readBy !== currentUserId) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date() } : msg
        ));
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [tripId, currentUserId, userType]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !socketRef.current) return;
    
    try {
      await fetch(`/api/trips/${tripId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        })
      });
      
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };
  
  const sendQuickMessage = async (templateKey: string) => {
    try {
      await fetch(`/api/trips/${tripId}/messages/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey })
      });
    } catch (error) {
      toast.error('Failed to send quick message');
    }
  };
  
  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/trips/${tripId}/messages/${messageId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };
  
  const handleEmergency = async () => {
    if (confirm('Are you sure you want to report an emergency? Support will be contacted immediately.')) {
      try {
        await fetch(`/api/trips/${tripId}/emergency`, {
          method: 'POST'
        });
        toast.success('Emergency reported. Support will contact you shortly.');
      } catch (error) {
        toast.error('Failed to report emergency');
      }
    }
  };
  
  return (
    <div className="trip-chat-interface flex flex-col h-full">
      {/* Chat Header */}
      <div className="chat-header bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {userType === 'driver' ? 'C' : 'D'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {userType === 'driver' ? 'Customer' : 'Driver'}
            </p>
            <p className="text-sm text-gray-500">
              {otherPartyOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${otherPartyPhone}`)}
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmergency}
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="messages-container flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === currentUserId}
            showReadStatus={message.sender_id === currentUserId}
          />
        ))}
        {isTyping && (
          <div className="typing-indicator flex items-center gap-2 text-gray-500">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
            <span className="text-sm">Typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Messages */}
      {userType === 'driver' && (
        <div className="quick-messages p-3 border-t bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage('driver_on_way')}
            >
              On my way
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage('driver_arrived')}
            >
              I'm here
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage('driver_late')}
            >
              Running late
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage('driver_traffic')}
            >
              Traffic delay
            </Button>
          </div>
        </div>
      )}
      
      {/* Message Input */}
      <div className="message-input p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-100 text-red-800 text-center p-2 text-sm">
          Reconnecting to chat...
        </div>
      )}
    </div>
  );
};
```

## Implementation Steps

### Phase 1: Core Chat System (Week 1)
1. **Backend Infrastructure**
   - WebSocket server setup with Socket.io
   - Message storage and retrieval APIs
   - Real-time message broadcasting

2. **Database Schema**
   - Trip messages table creation
   - Quick message templates setup
   - Message indexing for performance

3. **Basic Chat Interface**
   - Message display and input components
   - Real-time message updates
   - Connection state management

### Phase 2: Enhanced Features (Week 2)
1. **Quick Messages**
   - Template-based messaging system
   - Category-based message organization
   - Driver-specific quick actions

2. **Media Sharing**
   - Image upload and display
   - Photo verification for pickup
   - File storage integration

3. **Read Receipts & Status**
   - Message delivery confirmation
   - Read status tracking
   - Typing indicators

### Phase 3: Safety & Polish (Week 3)
1. **Emergency Features**
   - Emergency reporting system
   - Automatic support notification
   - Safety escalation procedures

2. **User Experience**
   - Message threading and history
   - Notification management
   - Accessibility improvements

3. **Performance & Security**
   - Message encryption implementation
   - Connection optimization
   - Content moderation features

## Success Metrics

### Performance KPIs
- Message delivery time < 100ms
- Chat connection uptime > 99%
- Image upload success rate > 95%
- Emergency response time < 30 seconds

### Business KPIs
- Driver-customer communication rate > 80%
- Average messages per trip: 3-5
- Emergency false positive rate < 5%
- Customer satisfaction with communication > 90%
