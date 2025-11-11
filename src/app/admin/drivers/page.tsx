'use client';

import React, { useState } from 'react';
import { DriverRegistrationForm } from './components/DriverRegistrationForm';
import { DriverTable } from './components/DriverTable';
import { Plus, List } from 'lucide-react';

export default function AdminDriversPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'register'>('list');

  const handleRegistrationSuccess = () => {
    setActiveTab('list');
  };

  const handleSendReminder = async (driverId: string) => {
    if (!confirm('Send reminder to this driver?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/drivers/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Reminder sent successfully!');
      } else {
        alert(result.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const handleViewDriver = (driverId: string) => {
    // Navigate to driver details page or open modal
    window.location.href = `/admin/drivers/${driverId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Driver Management
          </h1>
          <p className="mt-2 text-gray-600">
            Register and manage drivers for StepperGO
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-5 h-5" />
            Driver List
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-5 h-5" />
            Register New Driver
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <DriverTable
            onViewDriver={handleViewDriver}
            onSendReminder={handleSendReminder}
          />
        ) : (
          <DriverRegistrationForm onSuccess={handleRegistrationSuccess} />
        )}
      </div>
    </div>
  );
}
