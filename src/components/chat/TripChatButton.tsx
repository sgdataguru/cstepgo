'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat';
import { UNREAD_COUNT_POLL_INTERVAL } from '@/lib/constants/chat';

interface TripChatButtonProps {
  tripId: string;
  tripTitle: string;
  currentUserId: string;
  token: string;
  // Show button only if user has access (is driver, organizer, or has booking)
  hasAccess: boolean;
}

export function TripChatButton({
  tripId,
  tripTitle,
  currentUserId,
  token,
  hasAccess,
}: TripChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    if (!hasAccess) return;

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
      }
    }

    fetchUnreadCount();
    
    // Poll for unread count periodically
    const interval = setInterval(fetchUnreadCount, UNREAD_COUNT_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [tripId, token, hasAccess]);

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open chat"
      >
        <div className="relative">
          <svg
            className="w-6 h-6"
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

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Container */}
          <div className="relative w-full max-w-md h-[600px] sm:h-[700px]">
            <ChatInterface
              tripId={tripId}
              currentUserId={currentUserId}
              token={token}
              tripTitle={tripTitle}
              onClose={() => {
                setIsOpen(false);
                setUnreadCount(0); // Reset unread when closing
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
