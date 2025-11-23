'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  DollarSign, 
  Star, 
  Bell, 
  HelpCircle,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';

interface DriverData {
  id: string;
  fullName?: string;
  rating: number;
  availability: string;
}

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [driverData, setDriverData] = useState<DriverData | null>(null);

  useEffect(() => {
    // Load driver data from localStorage
    const storedDriverData = localStorage.getItem('driver_data');
    if (storedDriverData) {
      try {
        setDriverData(JSON.parse(storedDriverData));
      } catch (error) {
        console.error('Error parsing driver data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('driver_session');
    localStorage.removeItem('driver_data');
    localStorage.removeItem('user_data');
    router.push('/driver/login');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/driver/portal/dashboard', 
      icon: Home,
      description: 'Overview and quick stats'
    },
    { 
      name: 'Profile', 
      href: '/driver/portal/profile', 
      icon: User,
      description: 'Manage your profile and documents'
    },
    { 
      name: 'Earnings', 
      href: '/driver/portal/earnings', 
      icon: DollarSign,
      description: 'View earnings and trip history'
    },
    { 
      name: 'Ratings', 
      href: '/driver/portal/ratings', 
      icon: Star,
      description: 'See your ratings and feedback'
    },
    { 
      name: 'Notifications', 
      href: '/driver/portal/notifications', 
      icon: Bell,
      description: 'View all notifications'
    },
    { 
      name: 'Help & Support', 
      href: '/driver/portal/help', 
      icon: HelpCircle,
      description: 'Get help and support'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Mobile Menu Toggle */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link href="/driver/portal/dashboard" className="flex items-center ml-2 lg:ml-0">
                <span className="text-2xl font-bold text-blue-600">StepperGO</span>
                <span className="ml-2 text-sm text-gray-500">Driver Portal</span>
              </Link>
            </div>

            {/* Driver Info and Actions */}
            <div className="flex items-center space-x-4">
              {driverData && (
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {driverData.fullName || 'Driver'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center justify-end">
                      <Star className="w-3 h-3 text-yellow-400 mr-1" />
                      {driverData.rating.toFixed(1)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {(driverData.fullName || 'D')[0].toUpperCase()}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out mt-16 lg:mt-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
            <div className="flex-1 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-start px-3 py-3 text-sm font-medium rounded-lg
                      transition-colors duration-150 ease-in-out group
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        flex-shrink-0 w-5 h-5 mr-3 mt-0.5
                        ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
