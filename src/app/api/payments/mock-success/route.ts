import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

/**
 * POST /api/payments/mock-success
 *
 * Mock payment endpoint for POC that always returns successful transaction
 * This simulates the payment flow without actual payment processing
 *
 * SECURITY: Only available in development mode
 *
 * Request body:
 * {
 *   bookingId: string,
 *   amount: number,
 *   currency?: string
 * }
 *
 * Returns mock payment transaction details
 */
export async function POST(request: NextRequest) {
  // SECURITY: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Mock payment endpoint is disabled in production',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { bookingId, amount, currency = 'KZT' } = body;

    // Validate required fields
    if (!bookingId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: bookingId and amount',
        },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if booking already has a successful payment
    if (booking.payment && booking.payment.status === 'SUCCEEDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking already has a successful payment',
        },
        { status: 400 }
      );
    }

    // Generate mock transaction ID
    const mockTransactionId = `mock_tx_${nanoid(16)}`;
    const mockClientSecret = `mock_cs_${nanoid(24)}`;

    // Create or update payment record with successful status
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        stripeIntentId: mockTransactionId,
        stripeClientSecret: mockClientSecret,
        amount: amount,
        currency,
        status: 'SUCCEEDED',
        paymentMethod: 'mock_card',
        last4: '4242',
        succeededAt: new Date(),
        metadata: {
          mock: true,
          provider: 'mock-success-api',
          description: 'POC mock payment - always succeeds',
        },
      },
      update: {
        status: 'SUCCEEDED',
        succeededAt: new Date(),
        stripeIntentId: mockTransactionId,
        stripeClientSecret: mockClientSecret,
        paymentMethod: 'mock_card',
        last4: '4242',
        metadata: {
          mock: true,
          provider: 'mock-success-api',
          description: 'POC mock payment - always succeeds',
        },
      },
    });

    // Update booking status to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Return mock payment success response
    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId: mockTransactionId,
        clientSecret: mockClientSecret,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        last4: payment.last4,
        succeededAt: payment.succeededAt,
        message: 'Mock payment processed successfully (POC)',
      },
    });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process mock payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/mock-success
 *
 * Returns information about the mock payment API
 * SECURITY: Only available in development mode
 */
export async function GET() {
  // SECURITY: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Mock payment endpoint is disabled in production',
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      name: 'Mock Payment API',
      version: '1.0.0',
      description: 'POC mock payment endpoint that always returns successful transactions',
      usage: {
        method: 'POST',
        endpoint: '/api/payments/mock-success',
        body: {
          bookingId: 'string (required)',
          amount: 'number (required)',
          currency: 'string (optional, default: KZT)',
        },
      },
      notes: [
        'This is a mock API for POC purposes only',
        'Always returns successful payment',
        'Automatically confirms the booking',
        'Compatible with future Stripe Payment Links integration',
      ],
    },
  });
}
