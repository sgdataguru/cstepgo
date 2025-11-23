// Booking TypeScript interfaces for StepperGO

/**
 * Booking Status
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';

/**
 * Payment Status
 */
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

/**
 * Booking - Activity booking information
 */
export interface Booking {
    id: string;
    activityId: string;
    activityName: string;
    activityOwnerId: string;
    customerId: string;
    customerDetails: CustomerInfo;

    // Booking Details
    requestDate: Date;
    activityDate: Date;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    participants: number;

    // Pricing
    basePrice: number;
    totalPrice: number;
    currency: string;
    pricingBreakdown: PricingBreakdownItem[];

    // Status
    status: BookingStatus;
    paymentStatus: PaymentStatus;

    // Communication
    specialRequests?: string;
    communicationHistory: Message[];

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    completedAt?: Date;
}

/**
 * Customer Info - Customer details for booking
 */
export interface CustomerInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
    photoUrl?: string;
    language?: string;
    nationality?: string;
}

/**
 * Pricing Breakdown Item
 */
export interface PricingBreakdownItem {
    label: string;
    amount: number;
    quantity?: number;
    type: 'base' | 'package' | 'discount' | 'equipment' | 'tax' | 'fee';
}

/**
 * Message - Communication between owner and customer
 */
export interface Message {
    id: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    senderType: 'owner' | 'customer';
    content: string;
    attachments?: MessageAttachment[];
    timestamp: Date;
    read: boolean;
}

/**
 * Message Attachment
 */
export interface MessageAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}

/**
 * Booking Filters - Query filters for booking list
 */
export interface BookingFilters {
    status?: BookingStatus | 'all';
    activityId?: string;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'requestDate' | 'activityDate' | 'totalPrice' | 'status';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

/**
 * Paginated Booking Response
 */
export interface PaginatedBookingResponse {
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    summary: {
        pending: number;
        confirmed: number;
        cancelled: number;
        completed: number;
        totalRevenue: number;
    };
}

/**
 * Booking Action Request - Accept/decline booking
 */
export interface BookingActionRequest {
    bookingId: string;
    action: 'accept' | 'decline';
    message?: string;
    reason?: string; // Required for decline
}

/**
 * Booking Update Data - Fields that can be updated
 */
export interface BookingUpdateData {
    status?: BookingStatus;
    activityDate?: Date;
    startTime?: string;
    participants?: number;
    specialRequests?: string;
}

/**
 * Customer Review - Review left by customer after booking
 */
export interface CustomerReview {
    id: string;
    bookingId: string;
    activityId: string;
    customerId: string;
    customerName: string;
    customerPhotoUrl?: string;
    rating: number; // 1-5
    comment?: string;
    photos?: string[];
    helpful: number; // Count of helpful votes
    ownerResponse?: OwnerReviewResponse;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Owner Review Response
 */
export interface OwnerReviewResponse {
    comment: string;
    respondedAt: Date;
}

/**
 * Booking Statistics
 */
export interface BookingStatistics {
    period: 'week' | 'month' | 'quarter' | 'year';
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    conversionRate: number; // pending to confirmed
    cancellationRate: number;
    repeatCustomerRate: number;
    chartData: {
        date: string;
        bookings: number;
        revenue: number;
    }[];
}

/**
 * Compact Booking Info - For dashboard and lists
 */
export interface CompactBookingInfo {
    id: string;
    activityName: string;
    customerName: string;
    activityDate: Date;
    participants: number;
    totalPrice: number;
    currency: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    hasUnreadMessages: boolean;
}
