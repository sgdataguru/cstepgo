/**
 * Chat feature constants
 */

// Message length limits
export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGE_WARNING_LENGTH = 500;

// Typing indicator timeouts (milliseconds)
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
export const TYPING_STOP_DEBOUNCE = 1000; // 1 second

// Polling intervals (milliseconds)
export const UNREAD_COUNT_POLL_INTERVAL = 30000; // 30 seconds

// WebSocket configuration
export const SOCKET_IO_PATH = '/api/socket';
export const SOCKET_RECONNECTION_DELAY = 1000;
export const SOCKET_RECONNECTION_ATTEMPTS = 5;

// Message pagination
export const MESSAGES_PER_PAGE = 50;

// Admin notification
export const DEFAULT_ADMIN_EMAIL = 'admin@steppergo.com';
