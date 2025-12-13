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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gaming background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#cc00ff]/10"></div>
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#cc00ff]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10">
        <RegistrationFlow 
          onComplete={handleComplete} 
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
