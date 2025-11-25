/**
 * Receipt API
 * GET /api/receipts/[bookingId] - Get receipt data for a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getReceiptData, isEligibleForReceipt } from '@/lib/services/receiptService';

export const GET = withAuth(
  async (req: NextRequest, user, { params }: { params: { bookingId: string } }) => {
    try {
      const { bookingId } = params;

      // Check if booking is eligible for receipt
      const eligible = await isEligibleForReceipt(bookingId, user.userId);
      
      if (!eligible) {
        return NextResponse.json(
          { 
            error: 'Receipt not available',
            message: 'Receipt can only be generated for completed bookings with successful payment'
          },
          { status: 404 }
        );
      }

      // Get receipt data
      const receiptData = await getReceiptData(bookingId, user.userId);

      if (!receiptData) {
        return NextResponse.json(
          { error: 'Receipt not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: receiptData,
      });
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      return NextResponse.json(
        { error: 'Failed to generate receipt', details: error.message },
        { status: 500 }
      );
    }
  }
);
