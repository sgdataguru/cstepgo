'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_IO_PATH, TYPING_INDICATOR_TIMEOUT } from '@/lib/constants/chat';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'SYSTEM';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface UseSocketChatOptions {
  tripId: string;
  token: string;
  enabled?: boolean;
  currentUserId?: string; // Optional: for optimistic UI updates
  currentUserName?: string; // Optional: for optimistic UI updates
}

interface UseSocketChatReturn {
  socket: Socket | null;
  isConnected: boolean;
  conversationId: string | null;
  messages: Message[];
  sendMessage: (content: string, type?: Message['type'], metadata?: any) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  typingUsers: TypingUser[];
  error: string | null;
}

/**
 * Custom hook for managing real-time chat via Socket.IO
 */
export function useSocketChat({
  tripId,
  token,
  enabled = true,
  currentUserId,
  currentUserName,
}: UseSocketChatOptions): UseSocketChatReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !token || !tripId) {
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: SOCKET_IO_PATH,
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
      
      // Join the conversation room
      socketInstance.emit('join:conversation', { tripId });
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('conversation:joined', (data: { conversationId: string; tripId: string }) => {
      console.log('Joined conversation:', data.conversationId);
      setConversationId(data.conversationId);
    });

    socketInstance.on('message:new', (message: Message) => {
      console.log('New message received:', message);
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on('message:sent', (data: { messageId: string; tempId?: string }) => {
      console.log('Message sent confirmation:', data);
      // Update message status if needed
    });

    socketInstance.on('messages:read', (data: { userId: string; conversationId: string }) => {
      console.log('Messages read by:', data.userId);
      // Update message read status in UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId !== data.userId && msg.status !== 'READ'
            ? { ...msg, status: 'READ' as const }
            : msg
        )
      );
    });

    socketInstance.on('typing:start', (data: TypingUser) => {
      console.log('User started typing:', data.userName);
      setTypingUsers((prev) => {
        const exists = prev.some((u) => u.userId === data.userId);
        return exists ? prev : [...prev, data];
      });
    });

    socketInstance.on('typing:stop', (data: { userId: string }) => {
      console.log('User stopped typing:', data.userId);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    socketInstance.on('error', (errorData: { message: string }) => {
      console.error('Socket error:', errorData);
      setError(errorData.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [enabled, token, tripId]);

  // Send message
  const sendMessage = useCallback(
    (content: string, type: Message['type'] = 'TEXT', metadata?: any) => {
      if (!socket || !conversationId || !content.trim()) {
        return;
      }

      const tempId = `temp-${Date.now()}`;
      
      socket.emit('message:send', {
        conversationId,
        content: content.trim(),
        type,
        metadata: { ...metadata, tempId },
      });

      // Optimistically add message to UI (will be replaced by server response)
      // Note: Using temporary IDs until server confirms with real message
      if (currentUserId && currentUserName) {
        const optimisticMessage: Message = {
          id: tempId,
          conversationId,
          senderId: currentUserId,
          content: content.trim(),
          type,
          status: 'SENT',
          sentAt: new Date().toISOString(),
          sender: {
            id: currentUserId,
            name: currentUserName,
            avatar: null,
            role: 'PASSENGER',
          },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
      }
    },
    [socket, conversationId, currentUserId, currentUserName]
  );

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!socket || !conversationId) {
      return;
    }

    socket.emit('typing:stop', { conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, conversationId]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!socket || !conversationId) {
      return;
    }

    socket.emit('typing:start', { conversationId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_INDICATOR_TIMEOUT);
  }, [socket, conversationId, stopTyping]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!socket || !conversationId) {
      return;
    }

    socket.emit('messages:read', { conversationId });
  }, [socket, conversationId]);

  return {
    socket,
    isConnected,
    conversationId,
    messages,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    typingUsers,
    error,
  };
}
