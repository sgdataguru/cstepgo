'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: any;
  driver?: any;
  session?: any;
  navigation?: {
    dashboardUrl: string;
    nextSteps: string[];
  };
  error?: string;
}

export default function DriverLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/drivers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result: LoginResponse = await response.json();

      if (result.success) {
        setSuccess(result.message);
        
        // Store session info in localStorage (in production, use secure storage)
        if (result.session) {
          localStorage.setItem('driver_session', result.session.token);
          localStorage.setItem('driver_data', JSON.stringify(result.driver));
          localStorage.setItem('user_data', JSON.stringify(result.user));
        }

        // Redirect based on status
        setTimeout(() => {
          if (result.navigation?.dashboardUrl) {
            window.location.href = result.navigation.dashboardUrl;
          } else {
            window.location.href = '/driver/dashboard';
          }
        }, 1500);

      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#cc00ff]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="text-4xl font-bold text-[#00f0ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">🚗</div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Driver Portal <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Login</span>
        </h2>
        <p className="mt-2 text-center text-sm text-[#b3b3b3]">
          Sign in to your StepperGO driver account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm py-8 px-4 border border-[#00f0ff]/20 sm:rounded-xl sm:px-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="mb-4 p-4 bg-[#ff0055]/10 border border-[#ff0055]/30 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-[#ff0055]">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-[#ff0055]">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-[#00ff88]">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-[#00ff88]">
                    {success}
                  </p>
                  <p className="text-sm text-[#00ff88]/70 mt-1">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#b3b3b3]">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-[#00f0ff]/30 bg-[#111111] text-white rounded-lg placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] sm:text-sm transition-all"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#b3b3b3]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-[#00f0ff]/30 bg-[#111111] text-white rounded-lg placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] sm:text-sm transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#00f0ff] focus:ring-[#00f0ff] border-[#00f0ff]/30 bg-[#111111] rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-[#b3b3b3]">
                  Remember me for 30 days
                </label>
              </div>

              <div className="text-sm">
                <a href="/driver/forgot-password" className="font-medium text-[#00f0ff] hover:text-[#0099ff] transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium ${
                  isLoading 
                    ? 'bg-[#252525] text-[#666666] cursor-not-allowed' 
                    : 'bg-[#00f0ff] text-[#0a0a0a] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f0ff]'
                } transition-all`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#666666] mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#252525]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a1a1a] text-[#808080]">New driver?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/driver/register"
                className="w-full flex justify-center py-2 px-4 border border-[#cc00ff]/30 rounded-lg shadow-sm bg-transparent text-sm font-medium text-[#cc00ff] hover:border-[#cc00ff] hover:shadow-[0_0_15px_rgba(204,0,255,0.3)] transition-all"
              >
                Apply to become a driver
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#808080]">
              Need help? Contact support at{' '}
              <a href="mailto:drivers@steppergo.com" className="text-[#00f0ff] hover:text-[#0099ff] transition-colors">
                drivers@steppergo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
