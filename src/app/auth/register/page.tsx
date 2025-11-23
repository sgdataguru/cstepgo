'use client';

import { useState } from 'react';
import { RegistrationFlow } from './components/RegistrationFlow';

export default function RegisterPage() {
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = (userData: any) => {
    console.log('Registration complete:', userData);
    setIsComplete(true);
    // Redirect to trips or dashboard
    setTimeout(() => {
      window.location.href = '/trips';
    }, 3000);
  };

  const handleCancel = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-modernSg to-primary-peranakan flex items-center justify-center p-4">
      <RegistrationFlow 
        onComplete={handleComplete} 
        onCancel={handleCancel}
      />
    </div>
  );
}
