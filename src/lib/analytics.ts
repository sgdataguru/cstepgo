'use client';

import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key && host) {
      posthog.init(key, {
        api_host: host,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
      });
    }
  }
}

export { posthog };

// Event tracking helpers
export const trackEvent = {
  tripViewed: (tripId: string, userId?: string) => {
    posthog.capture('trip_viewed', {
      tripId,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  checkoutStarted: (data: {
    tripId: string;
    userId: string;
    bookingId: string;
    amount: number;
    currency?: string;
  }) => {
    posthog.capture('checkout_started', {
      ...data,
      currency: data.currency || 'KZT',
      timestamp: new Date().toISOString(),
    });
  },

  paymentSucceeded: (data: {
    tripId: string;
    userId: string;
    bookingId: string;
    paymentId: string;
    amount: number;
    currency?: string;
  }) => {
    posthog.capture('payment_succeeded', {
      ...data,
      currency: data.currency || 'KZT',
      timestamp: new Date().toISOString(),
    });
  },

  bookingConfirmed: (data: {
    tripId: string;
    userId: string;
    bookingId: string;
  }) => {
    posthog.capture('booking_confirmed', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  driverApplicationSubmitted: (userId: string) => {
    posthog.capture('driver_application_submitted', {
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  driverApproved: (driverId: string, userId: string) => {
    posthog.capture('driver_approved', {
      driverId,
      userId,
      timestamp: new Date().toISOString(),
    });
  },
};
