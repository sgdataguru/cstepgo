export interface DriverFormData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  
  // Vehicle Information
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor?: string;
  licensePlate: string;
  
  // Driver License
  licenseNumber: string;
  licenseExpiry: string;
  
  // Documents (S3 keys)
  documents: {
    driverLicense?: string;
    vehicleRegistration?: string;
    vehicleInsurance?: string;
    vehiclePhoto?: string;
    profilePhoto?: string;
  };
  
  // Options
  autoApprove: boolean;
  sendCredentials: boolean;
}

export interface Driver {
  id: string;
  driverId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  vehicleType: string;
  vehicleModel: string;
  vehicleMake: string;
  vehicleYear: number;
  vehicleColor?: string;
  licensePlate: string;
  licenseNumber: string;
  licenseExpiry: Date;
  documentsUrl: Record<string, string>;
  rating: number;
  completedTrips: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    createdAt: Date;
    lastLoginAt?: Date;
  };
}

export interface DriverCredentials {
  driverId: string;
  password: string;
  expiresAt: Date;
}

export interface DeliveryResult {
  channel: 'whatsapp' | 'sms' | 'email';
  success: boolean;
  error?: string;
}

export interface DocumentUpload {
  fileType: string;
  fileName: string;
  contentType: string;
  file: File;
}

export interface UploadProgress {
  fileType: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}
