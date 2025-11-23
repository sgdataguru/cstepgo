'use client';

import { useEffect, useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useSocketChat } from '@/hooks/useSocketChat';

interface ChatInterfaceProps {
  tripId: string;
  currentUserId: string;
  token: string;
  tripTitle?: string;
  onClose?: () => void;
}

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

export function ChatInterface({
  tripId,
  currentUserId,
  token,
  tripTitle,
  onClose,
}: ChatInterfaceProps) {
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const {
    isConnected,
    messages: realtimeMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    typingUsers,
    error,
  } = useSocketChat({
    tripId,
    token,
    enabled: true,
  });

  // Load message history via REST API
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const response = await fetch(`/api/messages/${tripId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load message history');
        }

        const data = await response.json();
        if (data.success && data.data.messages) {
          setHistoricalMessages(data.data.messages);
        }
      } catch (error) {
        console.error('Error loading message history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [tripId, token]);

  // Combine historical and realtime messages
  const allMessages = [
    ...historicalMessages,
    ...realtimeMessages.filter(
      (msg) => !historicalMessages.some((hMsg) => hMsg.id === msg.id)
    ),
  ];

  // Mark messages as read when chat is visible
  useEffect(() => {
    if (allMessages.length > 0 && isConnected) {
      const timer = setTimeout(() => {
        markAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allMessages.length, isConnected, markAsRead]);

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{tripTitle || 'Trip Chat'}</h2>
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={allMessages}
        currentUserId={currentUserId}
        onMessageVisible={(messageId) => {
          // Handle message visibility for read receipts
          console.log('Message visible:', messageId);
        }}
      />

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0].userName} is typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        disabled={!isConnected}
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
      />
    </div>
  );
}
