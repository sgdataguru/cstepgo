'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Car, DollarSign, AlertCircle, CheckCircle, Info, X, Settings } from 'lucide-react';

interface Notification {
  id: string;
  type: 'trip_request' | 'payment' | 'system' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [preferences, setPreferences] = useState({
    tripRequests: true,
    payments: true,
    systemAlerts: true,
    announcements: true
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) {
        router.push('/driver/login');
        return;
      }

      const driverData = JSON.parse(driverId);
      
      const response = await fetch(`/api/drivers/notifications`, {
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data.notifications || []);
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) return;

      const driverData = JSON.parse(driverId);
      
      await fetch(`/api/drivers/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const driverId = localStorage.getItem('driver_data');
      const session = localStorage.getItem('driver_session');
      
      if (!driverId || !session) return;

      const driverData = JSON.parse(driverId);
      
      await fetch(`/api/drivers/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-driver-id': driverData.id,
          'Authorization': `Bearer ${session}`
        }
      });

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_request':
        return <Car className="w-6 h-6 text-blue-500" />;
      case 'payment':
        return <DollarSign className="w-6 h-6 text-green-500" />;
      case 'system':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case 'announcement':
        return <Info className="w-6 h-6 text-purple-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
        <p className="text-gray-600 mt-1">Stay updated with your trips and earnings</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({notifications.filter(n => !n.isRead).length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                          {!notification.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.actionUrl && (
                          <button
                            onClick={() => router.push(notification.actionUrl!)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Notification Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Trip Requests</h4>
              <p className="text-sm text-gray-600">Get notified about new trip opportunities</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.tripRequests}
                onChange={(e) => setPreferences({ ...preferences, tripRequests: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Payment Updates</h4>
              <p className="text-sm text-gray-600">Receive alerts about earnings and payouts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.payments}
                onChange={(e) => setPreferences({ ...preferences, payments: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">System Alerts</h4>
              <p className="text-sm text-gray-600">Important system updates and maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.systemAlerts}
                onChange={(e) => setPreferences({ ...preferences, systemAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Announcements</h4>
              <p className="text-sm text-gray-600">Platform news and feature updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.announcements}
                onChange={(e) => setPreferences({ ...preferences, announcements: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
