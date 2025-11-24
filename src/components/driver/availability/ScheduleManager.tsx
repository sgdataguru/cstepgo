'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Coffee, XCircle } from 'lucide-react';

interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  scheduleType: 'break' | 'unavailable' | 'custom';
  reason?: string;
  isRecurring: boolean;
  recurringPattern?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleManagerProps {
  driverId: string;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ driverId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    scheduleType: 'break' as 'break' | 'unavailable' | 'custom',
    reason: ''
  });

  // Load schedules
  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const loadSchedules = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drivers/availability/schedule', {
        headers: {
          'x-driver-id': driverId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load schedules');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error loading schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate times
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }
    
    if (startTime < new Date()) {
      setError('Start time must be in the future');
      return;
    }
    
    try {
      const response = await fetch('/api/drivers/availability/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': driverId
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules([...schedules, data.data]);
        setShowCreateForm(false);
        setFormData({
          startTime: '',
          endTime: '',
          scheduleType: 'break',
          reason: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create schedule');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating schedule:', err);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    setError(null);
    
    try {
      const response = await fetch(`/api/drivers/availability/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'x-driver-id': driverId
        }
      });
      
      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete schedule');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error deleting schedule:', err);
    }
  };

  const getScheduleIcon = (type: string) => {
    switch (type) {
      case 'break':
        return <Coffee className="w-5 h-5 text-blue-600" />;
      case 'unavailable':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getScheduleColor = (type: string) => {
    switch (type) {
      case 'break':
        return 'bg-blue-50 border-blue-200';
      case 'unavailable':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isScheduleActive = (schedule: Schedule) => {
    const now = new Date();
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    return start <= now && end >= now;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">
            Break Time & Availability Schedule
          </h3>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={createSchedule} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Create New Schedule</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Type
            </label>
            <select
              value={formData.scheduleType}
              onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="break">Break Time</option>
              <option value="unavailable">Unavailable</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Lunch break, Personal appointment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={200}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Schedule
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No scheduled breaks or unavailability periods</p>
            <p className="text-sm mt-1">Click &quot;Add Schedule&quot; to create one</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-lg border ${getScheduleColor(schedule.scheduleType)} ${
                isScheduleActive(schedule) ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getScheduleIcon(schedule.scheduleType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {schedule.scheduleType}
                      </span>
                      {isScheduleActive(schedule) && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                          Active Now
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatDateTime(schedule.startTime)} → {formatDateTime(schedule.endTime)}
                      </p>
                      
                      {schedule.reason && (
                        <p className="text-sm text-gray-600">
                          {schedule.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors"
                  title="Delete schedule"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
