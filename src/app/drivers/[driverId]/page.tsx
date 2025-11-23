import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { redirect } from 'next/navigation';

interface DriverPageProps {
  params: {
    driverId: string;
  };
}

export default async function DriverPage({ params }: DriverPageProps) {
  const { driverId } = params;

  // In a real app, you would validate the driver ID and get driver info from the database
  // For now, we'll use a mock driver name
  const mockDriverName = "Alex Johnson";

  // You could also verify authentication here
  if (!driverId) {
    redirect('/auth/login');
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
