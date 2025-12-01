import { HeroSection } from '@/components/landing/HeroSection';
import { BookingForm } from '@/components/booking';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Top Corner Action Buttons */}
      <div className="fixed top-4 right-4 z-50 flex flex-col sm:flex-row gap-2">
        <Link
          href="/module-overview"
          className="bg-purple-500/90 backdrop-blur-sm hover:bg-purple-500 text-white px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg">📊</span>
          <span className="hidden sm:inline">Module Overview</span>
          <span className="sm:hidden">Modules</span>
        </Link>
        <Link
          href="/auth/register"
          className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
        >
          <span className="text-lg">👤</span>
          <span className="hidden sm:inline">Register as Passenger</span>
          <span className="sm:hidden">Passenger</span>
        </Link>
        <Link
          href="/admin/drivers/new"
          className="bg-primary-modernSg/90 backdrop-blur-sm hover:bg-primary-modernSg text-white px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🚗</span>
          <span className="hidden sm:inline">Apply as Driver</span>
          <span className="sm:hidden">Driver</span>
        </Link>
      </div>

      <HeroSection>
        {/* Main heading and booking form */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
          {/* Heading */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 drop-shadow-2xl">
              Travel Smarter,
              <br />
              <span className="text-primary-accent">Together</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-body max-w-2xl mx-auto drop-shadow-lg">
              Low cost travel across Central Asia
            </p>
          </div>

          {/* New Booking Form Widget */}
          <div className="w-full max-w-4xl">
            <BookingForm variant="hero" />
          </div>
        </div>
      </HeroSection>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-modernSg to-primary-peranakan">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12">
              Why Choose StepperGO?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-3">Real-time Pricing</h3>
                <p className="text-white/80 leading-relaxed">
                  Price drops as more people join your trip. Save up to 70% on private trips.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-white mb-3">Verified Drivers</h3>
                <p className="text-white/80 leading-relaxed">
                  All drivers thoroughly vetted, background checked, and rated by passengers.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white mb-3">Easy Communication</h3>
                <p className="text-white/80 leading-relaxed">
                  WhatsApp groups for every trip. Connect with fellow travelers instantly.
                </p>
              </div>
            </div>

            {/* Registration CTA Buttons */}
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
              <Link
                href="/auth/register"
                className="bg-white text-gray-900 px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-modernSg"
              >
                Register as Passenger
              </Link>
              <Link
                href="/admin/drivers/new"
                className="bg-transparent border-2 border-white text-white px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-200 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-modernSg"
              >
                Register as Driver
              </Link>
              <Link
                href="/trips/create?bookingType=private"
                className="bg-primary-accent/90 text-gray-900 px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:bg-primary-accent hover:shadow-2xl hover:scale-105 transition-all duration-200 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 focus:ring-offset-primary-modernSg"
              >
                Register a Private Trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 text-center mb-4">
              Popular Routes
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Discover the most traveled destinations across Kazakhstan and Kyrgyzstan
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRoutes.map((route) => (
                <Link
                  key={route.id}
                  href={`/trips?origin_city=${encodeURIComponent(route.from)}&destination_city=${encodeURIComponent(route.to)}`}
                  className="group bg-gradient-to-br from-neutral-light to-white border border-gray-200 p-6 min-h-[100px] rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-900">{route.from}</span>
                    <span className="text-primary-modernSg">→</span>
                    <span className="text-lg font-semibold text-gray-900">{route.to}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{route.distance}</p>
                  <p className="text-primary-accent font-bold text-xl">{route.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const popularRoutes = [
  {
    id: 1,
    from: 'Almaty',
    to: 'Charyn Canyon',
    distance: '~200 km',
    price: 'From ₸2,500'
  },
  {
    id: 2,
    from: 'Almaty',
    to: 'Bishkek',
    distance: '~240 km',
    price: 'From ₸3,500'
  },
  {
    id: 3,
    from: 'Bishkek',
    to: 'Issyk-Kul',
    distance: '~250 km',
    price: 'From ₸3,000'
  },
  {
    id: 4,
    from: 'Almaty Airport',
    to: 'Almaty City',
    distance: '~25 km',
    price: 'From ₸800'
  },
  {
    id: 5,
    from: 'Almaty',
    to: 'Medeu',
    distance: '~30 km',
    price: 'From ₸1,200'
  },
  {
    id: 6,
    from: 'Bishkek',
    to: 'Osh',
    distance: '~680 km',
    price: 'From ₸8,500'
  }
];
