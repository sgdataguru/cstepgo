'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  Star, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Navigation,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';

// Simple UI Components (temporary implementation)
const Dialog = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-xl font-semibold ${className}`}>
    {children}
  </h2>
);

const DialogFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-t flex gap-3 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  variant = 'default', 
  size = 'md', 
  className = '', 
  disabled = false,
  children, 
  onClick 
}: { 
  variant?: 'default' | 'outline'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  children: React.ReactNode; 
  onClick?: () => void;
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-white hover:bg-gray-50' 
    : 'bg-blue-600 text-white hover:bg-blue-700';
  const sizeClasses = size === 'lg' ? 'h-11 px-8 text-base' : size === 'sm' ? 'h-9 px-3 text-sm' : 'h-10 px-4';
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Badge = ({ 
  variant = 'default', 
  className = '', 
  children 
}: { 
  variant?: 'default' | 'secondary' | 'destructive'; 
  className?: string;
  children: React.ReactNode;
}) => {
  const variantClasses = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-900',
    destructive: 'bg-red-600 text-white'
  }[variant];
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

// Using simple avatar implementation since @radix-ui/react-avatar is not installed
const Avatar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`flex items-center justify-center rounded-full bg-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, className }: { src?: string; className?: string }) => 
  src ? <img src={src} alt="" className={`w-full h-full object-cover ${className}`} /> : null;

const AvatarFallback = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-center w-full h-full text-white font-medium ${className}`}>
    {children}
  </div>
);

const Separator = ({ className = '' }: { className?: string }) => (
  <hr className={`border-gray-200 ${className}`} />
);

const Alert = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 rounded-lg border border-blue-200 bg-blue-50 ${className}`}>
    {children}
  </div>
);

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="font-medium text-blue-900 mb-1">{children}</h5>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-blue-800">{children}</div>
);

// Types
export interface TripOffer {
  id: string;
  title: string;
  description: string;
  departureTime: string;
  returnTime: string;
  originName: string;
  originAddress: string;
  destName: string;
  destAddress: string;
  distance?: number;
  estimatedDuration?: number;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  basePrice: number;
  platformFee: number;
  estimatedEarnings: number;
  organizer: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  passengers?: Array<{
    seatsBooked: number;
    customerName: string;
  }>;
}

interface TripAcceptanceModalProps {
  isOpen: boolean;
  tripOffer: TripOffer | null;
  timeRemainingSeconds: number;
  urgency: 'normal' | 'high' | 'critical';
  onAccept: (tripId: string) => Promise<void>;
  onDecline: (tripId: string) => void;
  onTimeout: () => void;
  isProcessing?: boolean;
}

export const TripAcceptanceModal: React.FC<TripAcceptanceModalProps> = ({
  isOpen,
  tripOffer,
  timeRemainingSeconds: initialTimeRemaining,
  urgency,
  onAccept,
  onDecline,
  onTimeout,
  isProcessing = false
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [hasExpired, setHasExpired] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptanceState, setAcceptanceState] = useState<'default' | 'processing' | 'success' | 'error'>('default');

  // Update time remaining when prop changes
  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
    setHasExpired(initialTimeRemaining <= 0);
  }, [initialTimeRemaining]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || hasExpired || isProcessing) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setHasExpired(true);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, hasExpired, isProcessing, onTimeout]);

  // Handle trip acceptance
  const handleAccept = useCallback(async () => {
    if (!tripOffer || isAccepting || hasExpired) return;

    setIsAccepting(true);
    setAcceptanceState('processing');

    try {
      await onAccept(tripOffer.id);
      setAcceptanceState('success');
      
      // Auto-close after success animation
      setTimeout(() => {
        setAcceptanceState('default');
        setIsAccepting(false);
      }, 2000);
    } catch (error) {
      console.error('Trip acceptance error:', error);
      setAcceptanceState('error');
      setIsAccepting(false);
      
      // Reset state after error
      setTimeout(() => {
        setAcceptanceState('default');
      }, 3000);
    }
  }, [tripOffer, isAccepting, hasExpired, onAccept]);

  // Handle trip decline
  const handleDecline = useCallback(() => {
    if (!tripOffer || isAccepting || hasExpired) return;
    onDecline(tripOffer.id);
  }, [tripOffer, isAccepting, hasExpired, onDecline]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₸${amount.toLocaleString()}`;
  };

  // Format date/time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Timer color based on urgency and time remaining
  const getTimerColor = (): string => {
    if (hasExpired) return 'text-gray-400';
    if (timeRemaining <= 5) return 'text-red-500';
    if (timeRemaining <= 10) return 'text-amber-500';
    if (urgency === 'critical') return 'text-red-500';
    if (urgency === 'high') return 'text-amber-500';
    return 'text-green-500';
  };

  // Get urgency badge
  const getUrgencyBadge = () => {
    if (hasExpired) {
      return <Badge variant="secondary" className="text-gray-500">Expired</Badge>;
    }
    
    const variants = {
      normal: 'default',
      high: 'secondary',
      critical: 'destructive'
    } as const;
    
    return <Badge variant={variants[urgency]}>Trip Request</Badge>;
  };

  if (!tripOffer) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            {getUrgencyBadge()}
            <div className={`text-3xl font-bold tabular-nums ${getTimerColor()}`}>
              {hasExpired ? '0:00' : formatTime(timeRemaining)}
            </div>
          </div>
          <DialogTitle className="text-left text-xl">
            {tripOffer.title}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 space-y-6">
          {/* Route Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-4">
              {/* Pickup Location */}
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tripOffer.originName}</p>
                  <p className="text-sm text-gray-600">{tripOffer.originAddress}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Pickup • {formatDateTime(tripOffer.departureTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Line */}
              <div className="ml-6 border-l-2 border-dashed border-gray-300 h-8" />

              {/* Destination */}
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tripOffer.destName}</p>
                  <p className="text-sm text-gray-600">{tripOffer.destAddress}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {tripOffer.distance && (
                      <div className="flex items-center gap-1">
                        <Navigation className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {tripOffer.distance} km
                        </span>
                      </div>
                    )}
                    {tripOffer.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          ~{tripOffer.estimatedDuration} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tripOffer.organizer.avatar} />
              <AvatarFallback className="bg-blue-500 text-white">
                {tripOffer.organizer.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{tripOffer.organizer.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">4.8 • Trip organizer</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Passengers</p>
              <p className="text-lg font-bold text-gray-900">
                {tripOffer.bookedSeats}/{tripOffer.totalSeats}
              </p>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Earnings Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-medium">{formatCurrency(tripOffer.basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fees</span>
                <span className="font-medium">{formatCurrency(tripOffer.platformFee)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Service Fee</span>
                <span>-{formatCurrency((tripOffer.basePrice + tripOffer.platformFee) - tripOffer.estimatedEarnings)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-lg font-bold text-emerald-600">
                <span>Your Earnings</span>
                <span>{formatCurrency(tripOffer.estimatedEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Passengers List */}
          {tripOffer.passengers && tripOffer.passengers.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Passengers</h3>
              <div className="space-y-2">
                {tripOffer.passengers.map((passenger, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{passenger.customerName}</span>
                    <span className="font-medium">
                      {passenger.seatsBooked} seat{passenger.seatsBooked > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Requirements Alert */}
          {tripOffer.description && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Trip Details</AlertTitle>
              <AlertDescription>{tripOffer.description}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 pt-4 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDecline}
            disabled={isAccepting || hasExpired}
            className="flex-1"
          >
            Decline
          </Button>
          
          <Button
            size="lg"
            onClick={handleAccept}
            disabled={isAccepting || hasExpired}
            className="flex-2 bg-emerald-500 hover:bg-emerald-600"
          >
            {acceptanceState === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : acceptanceState === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Accepted!
              </>
            ) : acceptanceState === 'error' ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Try Again
              </>
            ) : hasExpired ? (
              'Expired'
            ) : (
              'Accept Trip'
            )}
          </Button>
        </DialogFooter>

        {/* Expiry Overlay */}
        {hasExpired && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4">
              <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Time Expired
              </h3>
              <p className="text-gray-600">
                This trip has been offered to other drivers
              </p>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {acceptanceState === 'processing' && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
            <div className="bg-white p-6 rounded-lg text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Confirming trip acceptance...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing trip acceptance state
export const useTripAcceptance = () => {
  const [activeOffer, setActiveOffer] = useState<{
    trip: TripOffer;
    timeRemainingSeconds: number;
    urgency: 'normal' | 'high' | 'critical';
  } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for active trip offers
  const checkActiveOffers = async (driverId: string) => {
    try {
      const response = await fetch(`/api/drivers/trips/offer?driverId=${driverId}`, {
        headers: {
          'x-driver-id': driverId
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data.hasActiveOffer) {
        setActiveOffer({
          trip: data.data.trip,
          timeRemainingSeconds: data.data.timeRemainingSeconds,
          urgency: data.data.urgency
        });
        setIsModalOpen(true);
      } else {
        setActiveOffer(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error checking active offers:', error);
    }
  };

  // Accept trip
  const acceptTrip = async (tripId: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/drivers/trips/acceptance/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': 'current-driver-id' // Replace with actual driver ID
        },
        body: JSON.stringify({
          tripId,
          action: 'accept'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept trip');
      }
      
      // Close modal on success
      setIsModalOpen(false);
      setActiveOffer(null);
      
      // Redirect to trip management or show success message
      console.log('Trip accepted successfully:', data.data);
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Decline trip
  const declineTrip = (tripId: string): void => {
    fetch('/api/drivers/trips/acceptance/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-driver-id': 'current-driver-id' // Replace with actual driver ID
      },
      body: JSON.stringify({
        tripId,
        action: 'decline'
      })
    }).catch(error => {
      console.error('Error declining trip:', error);
    });
    
    setIsModalOpen(false);
    setActiveOffer(null);
  };

  // Handle timeout
  const handleTimeout = (): void => {
    setIsModalOpen(false);
    setActiveOffer(null);
  };

  return {
    activeOffer,
    isModalOpen,
    isProcessing,
    checkActiveOffers,
    acceptTrip,
    declineTrip,
    handleTimeout
  };
};

export default TripAcceptanceModal;
