'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DriverDashboard } from '@/components/driver/DriverDashboard';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const driverSession = localStorage.getItem('driver_session');
    const driverDataStr = localStorage.getItem('driver_data');
    const userDataStr = localStorage.getItem('user_data');

    if (!driverSession || !driverDataStr || !userDataStr) {
      router.push('/driver/login');
      return;
    }

    try {
      const driver = JSON.parse(driverDataStr);
      const user = JSON.parse(userDataStr);
      
      setDriverData({
        driverId: driver.id,
        userId: user.id,
        driverName: user.name,
        email: user.email,
        session: driverSession
      });
    } catch (error) {
      console.error('Error parsing driver data:', error);
      router.push('/driver/login');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driverData) {
    return null;
  }

  return (
    <DriverDashboard 
      driverId={driverData.driverId}
      driverName={driverData.driverName}
    />
  );
}
