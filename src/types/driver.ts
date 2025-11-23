import { DriverCredentials } from '@/lib/auth/credentials';

export interface DriverRegistrationData {
  // Personal Information
  fullName: string;
  phone: string;
  email?: string;
  nationalId: string;
  
  // Vehicle Information
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  vehicleColor: string;
  seatCapacity: number;
  
  // Service Area
  homeCity: string;
  serviceRadiusKm: number;
  willingToTravel: string[];
  
  // Documents (base64 or URLs)
  documents: {
    license?: string;
    registration?: string;
    insurance?: string;
    profilePhoto?: string;
  };
}

export interface DriverRegistrationResponse {
  success: boolean;
  driver: {
    id: string;
    driverId: string;
    fullName: string;
    phone: string;
    status: string;
  };
  credentials: DriverCredentials;
  delivery: {
    whatsapp: string;
    sms: string;
    email: string;
  };
}
