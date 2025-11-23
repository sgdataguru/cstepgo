# Real-Time Driver-Customer Communication

This feature enables persistent, real-time communication between drivers and customers for intercity trips on StepperGO.

## Features

- ✅ Real-time bidirectional messaging via WebSocket (Socket.IO)
- ✅ Message persistence in PostgreSQL database
- ✅ Typing indicators
- ✅ Read receipts and delivery confirmations
- ✅ User authentication via session tokens
- ✅ Trip-based conversation isolation
- ✅ Message reporting for abuse/moderation
- ✅ Optimistic UI updates
- ✅ Auto-scroll to new messages
- ✅ Unread message counters

## Architecture

### Database Schema

The chat system uses three main models:

1. **Conversation** - Represents a chat thread linked to a trip
2. **ConversationParticipant** - Tracks users in a conversation with read status
3. **Message** - Individual messages with content, type, and status

### Backend Components

#### WebSocket Server (`/src/app/api/socket/route.ts`)
- Handles real-time connections via Socket.IO
- Authenticates users via session tokens
- Manages room-based messaging for trip conversations
- Broadcasts messages to all participants
- Handles typing indicators and read receipts

#### REST API Routes
- `GET /api/messages/[tripId]` - Fetch conversation history
- `POST /api/messages/send` - Send a message (REST fallback)
- `POST /api/messages/read` - Mark messages as read
- `POST /api/messages/report` - Report a message for abuse

### Frontend Components

#### Custom Hook: `useSocketChat`
```typescript
import { useSocketChat } from '@/hooks/useSocketChat';

const {
  isConnected,
  messages,
  sendMessage,
  startTyping,
  stopTyping,
  markAsRead,
  typingUsers,
  error
} = useSocketChat({
  tripId: 'trip_id',
  token: 'session_token',
  enabled: true
});
```

#### UI Components
- **ChatInterface** - Main chat component with header, messages, and input
- **MessageList** - Displays message history with bubbles and timestamps
- **MessageInput** - Text input with send button and typing detection
- **TripChatButton** - Floating chat button with unread badge
- **ChatNotificationBadge** - Unread message counter badge

## Usage

### For Trip Details Page

Add the chat button to any trip page where the user has access (driver, organizer, or passenger):

```tsx
import { TripChatButton } from '@/components/chat/TripChatButton';

// In your component
<TripChatButton
  tripId={trip.id}
  tripTitle={trip.title}
  currentUserId={user.id}
  token={sessionToken}
  hasAccess={isDriverOrPassenger}
/>
```

### For Driver Dashboard

```tsx
import { ChatInterface } from '@/components/chat';

// In your dashboard
<div className="h-[600px]">
  <ChatInterface
    tripId={activeTrip.id}
    currentUserId={driver.userId}
    token={sessionToken}
    tripTitle={activeTrip.title}
  />
</div>
```

## Access Control

Only users with access to a trip can view and participate in its conversation:
- Trip driver (driverId matches)
- Trip organizer (organizerId matches)
- Passengers with confirmed bookings

Authentication is enforced at both WebSocket connection and REST API levels.

## Message Types

- `TEXT` - Standard text messages
- `IMAGE` - Image attachments (future)
- `FILE` - File attachments (future)
- `LOCATION` - Location sharing (future)
- `SYSTEM` - Automated system messages

## Message Status

- `SENT` - Message sent to server
- `DELIVERED` - Message delivered to recipient(s)
- `READ` - Message read by recipient(s)
- `FAILED` - Message failed to send

## Security & Moderation

### Authentication
- WebSocket connections require valid session tokens
- Session tokens are verified against the database
- Expired sessions are rejected

### Authorization
- Users can only access conversations for trips they're involved in
- Participant verification on every message send

### Content Moderation
- Messages can be reported for abuse
- Reported messages trigger admin notifications
- Admin interface can hide/moderate messages

### Rate Limiting
⚠️ **TODO**: Implement rate limiting to prevent spam
- Suggested: 10 messages per minute per user
- Socket.IO middleware or Redis-based limiter

## Environment Variables

Required environment variables:
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-domain.com
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

## Database Migration

To apply the chat schema to your database:

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npx prisma migrate dev --name add_chat_feature

# Apply migration to production
npx prisma migrate deploy
```

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join:conversation` | `{ tripId: string }` | Join a trip conversation |
| `message:send` | `{ conversationId, content, type?, metadata? }` | Send a message |
| `typing:start` | `{ conversationId }` | Indicate user is typing |
| `typing:stop` | `{ conversationId }` | Indicate user stopped typing |
| `messages:read` | `{ conversationId }` | Mark all messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:joined` | `{ conversationId, tripId }` | Successfully joined conversation |
| `message:new` | `Message` | New message received |
| `message:sent` | `{ messageId, tempId? }` | Message sent confirmation |
| `messages:read` | `{ userId, conversationId }` | User read messages |
| `typing:start` | `{ userId, userName }` | User started typing |
| `typing:stop` | `{ userId }` | User stopped typing |
| `error` | `{ message }` | Error occurred |

## Testing

### Manual Testing

1. **Setup**: Create a trip with a driver and booking
2. **Open two browsers**: One as driver, one as passenger
3. **Load trip page**: Both users should see chat button
4. **Send messages**: Messages should appear in real-time
5. **Test typing**: Typing indicator should show
6. **Test read receipts**: Check marks should update
7. **Test offline**: Messages should queue and send when reconnected

### Automated Testing

⚠️ **TODO**: Add automated tests
- Unit tests for useSocketChat hook
- Integration tests for API routes
- E2E tests for chat flow

## Performance Considerations

### Optimizations
- Messages are paginated (future enhancement)
- WebSocket connection reuse
- Optimistic UI updates
- Auto-reconnection on connection loss

### Scaling
For production at scale, consider:
- Redis adapter for Socket.IO (multi-server support)
- Message pagination with infinite scroll
- Image compression for attachments
- CDN for file storage

## Future Enhancements

- [ ] Image/file attachments
- [ ] Location sharing
- [ ] Voice messages
- [ ] Message search
- [ ] Message editing/deletion
- [ ] Conversation archives
- [ ] Push notifications (mobile)
- [ ] Email notifications for offline users
- [ ] Admin moderation dashboard
- [ ] Message encryption (E2E)
- [ ] Conversation export

## Troubleshooting

### WebSocket Connection Issues

**Problem**: "Authentication required" error
- **Solution**: Ensure session token is valid and not expired

**Problem**: Messages not appearing in real-time
- **Solution**: Check browser console for WebSocket errors
- **Solution**: Verify Socket.IO path configuration matches server

**Problem**: "Access denied to this conversation"
- **Solution**: Ensure user has a booking, is the driver, or is the organizer

### Database Issues

**Problem**: "Conversation not found"
- **Solution**: Conversation is auto-created on first message

**Problem**: Prisma client errors
- **Solution**: Run `npm run db:generate` to regenerate client

## Support

For technical support or questions:
- Check implementation in `/src/components/chat/` and `/src/app/api/messages/`
- Review WebSocket server in `/src/app/api/socket/route.ts`
- Test with provided examples

## License

This feature is part of the StepperGO platform. All rights reserved.
