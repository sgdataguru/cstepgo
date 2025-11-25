/**
 * Receipt Component
 * Displays a formatted receipt for printing and viewing
 */

import React from 'react';
import { format } from 'date-fns';
import { BUSINESS_CONFIG } from '@/config/business';

export interface ReceiptData {
  bookingId: string;
  receiptNumber: string;
  issueDate: string;
  
  passengerName: string;
  passengerEmail?: string;
  passengerPhone?: string;
  
  tripTitle: string;
  tripType: string;
  originName: string;
  originAddress: string;
  destinationName: string;
  destinationAddress: string;
  departureTime: string;
  returnTime?: string;
  
  bookingDate: string;
  seatsBooked: number;
  passengers: any[];
  
  paymentMethod: string;
  paymentStatus: string;
  last4?: string;
  transactionId?: string;
  paymentDate?: string;
  
  baseAmount: number;
  pricePerSeat?: number;
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  
  status: string;
  completedAt?: string;
  
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

interface ReceiptProps {
  data: ReceiptData;
}

export default function Receipt({ data }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return `${data.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };

  return (
    <div className="receipt-container max-w-4xl mx-auto bg-white p-8 print:p-6">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{BUSINESS_CONFIG.RECEIPT.COMPANY_NAME}</h1>
            <p className="text-sm text-gray-600 mt-1">Travel Receipt</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{data.receiptNumber}</div>
            <div className="text-sm text-gray-600 mt-1">
              Issued: {formatDate(data.issueDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Information */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Passenger Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{data.passengerName}</p>
          </div>
          {data.passengerEmail && (
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{data.passengerEmail}</p>
            </div>
          )}
          {data.passengerPhone && (
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{data.passengerPhone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Booking ID</p>
            <p className="font-medium text-gray-900 text-xs">{data.bookingId}</p>
          </div>
        </div>
      </div>

      {/* Trip Information */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Trip Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Trip</p>
            <p className="font-medium text-gray-900">{data.tripTitle}</p>
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
              data.tripType === 'SHARED' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {data.tripType === 'SHARED' ? '👥 Shared Ride' : '🚗 Private Trip'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium text-gray-900">{data.originName}</p>
              <p className="text-xs text-gray-500">{data.originAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To</p>
              <p className="font-medium text-gray-900">{data.destinationName}</p>
              <p className="text-xs text-gray-500">{data.destinationAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-medium text-gray-900">{formatDate(data.departureTime)}</p>
            </div>
            {data.returnTime && (
              <div>
                <p className="text-sm text-gray-600">Return</p>
                <p className="font-medium text-gray-900">{formatDate(data.returnTime)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">Seats Booked</p>
            <p className="font-medium text-gray-900">{data.seatsBooked}</p>
          </div>
        </div>
      </div>

      {/* Driver Information (if available) */}
      {data.driverName && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Driver Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Driver</p>
              <p className="font-medium text-gray-900">{data.driverName}</p>
            </div>
            {data.driverPhone && (
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-medium text-gray-900">{data.driverPhone}</p>
              </div>
            )}
            {data.vehicleInfo && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="font-medium text-gray-900">{data.vehicleInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="mb-6 border-t-2 border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h2>
        <div className="space-y-2">
          {data.tripType === 'SHARED' && data.pricePerSeat && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Price per seat ({data.seatsBooked} × {formatCurrency(data.pricePerSeat)})
              </span>
              <span className="text-gray-900">{formatCurrency(data.subtotal)}</span>
            </div>
          )}
          {data.tripType !== 'SHARED' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Fare</span>
              <span className="text-gray-900">{formatCurrency(data.baseAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee ({BUSINESS_CONFIG.PLATFORM_FEE_RATE * 100}%)</span>
            <span className="text-gray-900">{formatCurrency(data.platformFee)}</span>
          </div>
          {data.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">{formatCurrency(data.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-gray-900">{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-6 bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-medium text-gray-900">{data.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-medium text-green-700">{data.paymentStatus}</p>
          </div>
          {data.transactionId && (
            <div>
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-medium text-gray-900 text-xs">{data.transactionId}</p>
            </div>
          )}
          {data.paymentDate && (
            <div>
              <p className="text-sm text-gray-600">Payment Date</p>
              <p className="font-medium text-gray-900">{formatDate(data.paymentDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Refund Information (if applicable) */}
      {data.refundAmount && (
        <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Refund Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Refund Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(data.refundAmount)}</p>
            </div>
            {data.refundDate && (
              <div>
                <p className="text-sm text-gray-600">Refund Date</p>
                <p className="font-medium text-gray-900">{formatDate(data.refundDate)}</p>
              </div>
            )}
            {data.refundReason && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium text-gray-900">{data.refundReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-6">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">Thank you for choosing {BUSINESS_CONFIG.RECEIPT.COMPANY_NAME}!</p>
          <p className="mb-2">For support, contact us at {BUSINESS_CONFIG.RECEIPT.SUPPORT_EMAIL}</p>
          <p className="text-xs text-gray-500">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .receipt-container {
            padding: 20px;
            max-width: 100%;
          }
          
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
