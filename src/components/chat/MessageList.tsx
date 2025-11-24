'use client';

import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onMessageVisible?: (messageId: string) => void;
}

export function MessageList({ messages, currentUserId, onMessageVisible }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as visible (for read receipts)
  useEffect(() => {
    if (!onMessageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              onMessageVisible(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = containerRef.current?.querySelectorAll('[data-message-id]');
    messageElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, onMessageVisible]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-500">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const isSystemMessage = message.type === 'SYSTEM';

        if (isSystemMessage) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="bg-gray-100 text-gray-600 text-xs rounded-full px-4 py-2">
                {message.content}
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            data-message-id={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isOwnMessage && (
                <div className="flex-shrink-0 mr-2">
                  {message.sender.avatar ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div className="flex flex-col">
                {!isOwnMessage && (
                  <div className="text-xs text-gray-500 mb-1 px-1">
                    {message.sender.name}
                    {message.sender.role === 'DRIVER' && (
                      <span className="ml-1 text-blue-600 font-medium">• Driver</span>
                    )}
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>

                {/* Timestamp and status */}
                <div
                  className={`flex items-center gap-1 mt-1 px-1 ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                  </span>
                  {isOwnMessage && (
                    <span className="text-xs">
                      {message.status === 'SENT' && <span className="text-gray-400">✓</span>}
                      {message.status === 'DELIVERED' && <span className="text-gray-400">✓✓</span>}
                      {message.status === 'READ' && <span className="text-blue-500">✓✓</span>}
                      {message.status === 'FAILED' && <span className="text-red-500">!</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
