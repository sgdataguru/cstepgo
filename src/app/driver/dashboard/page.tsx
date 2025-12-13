'use client';

import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DriverData {
  id: string;
  driverId: string;
  fullName?: string;
  status: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>('Driver');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for driver session in localStorage
    const sessionToken = localStorage.getItem('driver_session');
    const driverDataStr = localStorage.getItem('driver_data');
    const userDataStr = localStorage.getItem('user_data');

    if (!sessionToken || !driverDataStr) {
      // No session, redirect to login
      router.push('/driver/login');
      return;
    }

    try {
      const driverData: DriverData = JSON.parse(driverDataStr);
      const userData: UserData = userDataStr ? JSON.parse(userDataStr) : null;

      // Use the driver's internal ID for API calls
      setDriverId(driverData.id);
      setDriverName(driverData.fullName || userData?.name || 'Driver');
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing driver session:', error);
      router.push('/driver/login');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
          <p className="text-[#b3b3b3]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driverId) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DriverDashboard 
        driverId={driverId}
        driverName={driverName}
      />
    </div>
  );
}
