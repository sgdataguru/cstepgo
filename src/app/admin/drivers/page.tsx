'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Driver {
  id: string;
  driverId: string;
  fullName: string | null;
  status: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate: string;
  homeCity: string | null;
  rating: number;
  completedTrips: number;
  createdAt: string;
  user: {
    phone: string;
    email: string | null;
    isFirstLogin: boolean;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function DriversListPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchDrivers();
  }, []);
  
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Get authentication token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (vehicleTypeFilter !== 'ALL') params.append('vehicleType', vehicleTypeFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/drivers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setDrivers(data.drivers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchDrivers();
    }
  }, [pagination.page, statusFilter, vehicleTypeFilter]);
  
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDrivers();
  };
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30',
      APPROVED: 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30',
      REJECTED: 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/30',
      SUSPENDED: 'bg-[#666666]/20 text-[#808080] border border-[#666666]/30',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-[#252525] text-[#808080]'}`}>
        {status}
      </span>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#00f0ff]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Driver <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Management</span>
              </h1>
              <p className="text-sm text-[#808080] mt-1">
                {pagination.total} driver{pagination.total !== 1 ? 's' : ''} registered
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/settings"
                className="px-4 py-2.5 bg-[#1a1a1a] border border-[#cc00ff]/30 text-[#cc00ff] rounded-lg font-medium hover:border-[#cc00ff] hover:shadow-[0_0_15px_rgba(204,0,255,0.3)] transition-all flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <Link
                href="/admin/drivers/new"
                className="px-6 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#0099ff] text-[#0a0a0a] rounded-lg font-medium hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register New Driver
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#00f0ff]/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Search
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Name, Driver ID, or Phone"
                  className="flex-1 px-4 py-2 border border-[#00f0ff]/30 bg-[#111111] text-white placeholder-[#666666] rounded-lg focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-[#00f0ff] text-[#0a0a0a] rounded-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#00f0ff]/30 bg-[#111111] text-white rounded-lg focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            
            {/* Vehicle Type Filter */}
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Vehicle Type
              </label>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#00f0ff]/30 bg-[#111111] text-white rounded-lg focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-all"
              >
                <option value="ALL">All Types</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="MINIBUS">Minibus</option>
                <option value="VAN">Van</option>
                <option value="BUS">Bus</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Drivers Table */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#00f0ff]/20 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#00f0ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-[#666666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">No drivers found</h3>
              <p className="mt-2 text-sm text-[#808080]">
                {searchQuery || statusFilter !== 'ALL' || vehicleTypeFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Get started by registering your first driver'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#252525]">
                  <thead className="bg-[#111111]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#00f0ff] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252525]">
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-[#252525]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#cc00ff] flex items-center justify-center text-[#0a0a0a] font-semibold">
                                {(driver.fullName || 'D')[0].toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {driver.fullName || 'Unnamed Driver'}
                              </div>
                              <div className="text-sm text-[#808080]">{driver.driverId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {driver.vehicleMake} {driver.vehicleModel}
                          </div>
                          <div className="text-sm text-[#808080]">
                            {driver.licensePlate} • {driver.vehicleType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{driver.user.phone}</div>
                          {driver.user.email && (
                            <div className="text-sm text-[#808080]">{driver.user.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getStatusBadge(driver.status)}
                            {driver.user.isFirstLogin && (
                              <div className="text-xs text-[#ff6600] flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Not logged in
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-white">
                            <svg className="h-4 w-4 text-[#FFD700] mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {driver.rating.toFixed(1)}
                          </div>
                          <div className="text-sm text-[#808080]">
                            {driver.completedTrips} trips
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/driver/${driver.id}`)}
                            className="text-[#00f0ff] hover:text-[#0099ff] mr-3 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => alert('Edit functionality coming soon')}
                            className="text-[#cc00ff] hover:text-[#ff00ff] transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-[#111111] px-6 py-4 flex items-center justify-between border-t border-[#252525]">
                  <div className="text-sm text-[#b3b3b3]">
                    Showing page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-[#00f0ff]/30 bg-[#1a1a1a] rounded-lg text-sm font-medium text-white hover:border-[#00f0ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-[#00f0ff]/30 bg-[#1a1a1a] rounded-lg text-sm font-medium text-white hover:border-[#00f0ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
