import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DriverDashboardPage() {
  // In a real app, you would get the driver ID from the session/auth
  // For now, we'll check cookies for a driver session
  const cookieStore = cookies();
  const driverSession = cookieStore.get('driver-session');
  
  // Mock driver ID - in production this would come from authenticated session
  const driverId = driverSession?.value || 'mock-driver-id';
  const mockDriverName = "Alex Johnson";

  // You could also verify authentication here
  if (!driverId || driverId === 'mock-driver-id') {
    // In production, redirect to login if no valid session
    // redirect('/driver/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverDashboard 
        driverId={driverId}
        driverName={mockDriverName}
      />
    </div>
  );
}

export const metadata = {
  title: 'Driver Dashboard - StepperGO',
  description: 'Manage your trips and earnings as a StepperGO driver',
};
