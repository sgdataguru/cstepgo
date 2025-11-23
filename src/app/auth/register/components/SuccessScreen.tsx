interface SuccessScreenProps {
  userName: string;
}

export function SuccessScreen({ userName }: SuccessScreenProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to StepperGO!
        </h2>
        <p className="text-lg text-gray-600">
          Your account is ready, {userName}! 🎉
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 text-left">
        <h3 className="font-semibold text-gray-900 mb-3">What you can do now:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            <span>Browse shared and private trips</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            <span>Book trips with instant confirmation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            <span>Join trip WhatsApp groups</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            <span>Save favorite routes and drivers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            <span>Track your bookings in real-time</span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/trips'}
          className="w-full bg-primary-modernSg hover:bg-primary-modernSg/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🔍</span>
          Start Exploring Trips
        </button>

        <button
          onClick={() => window.location.href = '/profile'}
          className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>💼</span>
          Complete Your Profile
        </button>
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/'}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Skip for now - Go to Homepage
        </button>
      </div>

      <div className="flex justify-center gap-4 text-xs text-gray-500">
        <a href="/help" className="hover:underline">Contact Support</a>
        <span>•</span>
        <a href="/guide" className="hover:underline">View Guide</a>
      </div>
    </div>
  );
}
