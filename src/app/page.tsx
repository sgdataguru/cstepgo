import { HeroSection } from '@/components/landing/HeroSection';
import { BookingForm } from '@/components/booking';
import { PopularRoutesSection } from '@/components/landing/PopularRoutesSection';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Top Corner Action Buttons - Gaming Neon Style */}
      <div className="fixed top-4 right-4 z-50 flex flex-col sm:flex-row gap-2">
        <Link
          href="/module-overview"
          className="bg-[#cc00ff]/90 backdrop-blur-sm hover:bg-[#cc00ff] text-white px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(204,0,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2 border border-[#cc00ff]/30"
        >
          <span className="text-lg">📊</span>
          <span className="hidden sm:inline">Module Overview</span>
          <span className="sm:hidden">Modules</span>
        </Link>
        <Link
          href="/auth/register"
          className="bg-[#1a1a1a]/90 backdrop-blur-sm hover:bg-[#252525] text-white px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2 border border-[#00f0ff]/30 hover:border-[#00f0ff]"
        >
          <span className="text-lg">👤</span>
          <span className="hidden sm:inline">Register as Passenger</span>
          <span className="sm:hidden">Passenger</span>
        </Link>
        <Link
          href="/admin/drivers/new"
          className="bg-[#00f0ff]/90 backdrop-blur-sm hover:bg-[#00f0ff] text-[#0a0a0a] px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🚗</span>
          <span className="hidden sm:inline">Apply as Driver</span>
          <span className="sm:hidden">Driver</span>
        </Link>
      </div>

      <HeroSection>
        {/* Main heading and booking form */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
          {/* Heading with Neon Glow */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 drop-shadow-2xl">
              Travel Smarter,
              <br />
              <span className="text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">Together</span>
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

      {/* Features Section - Gaming Dark Theme */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] relative overflow-hidden">
        {/* Neon accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cc00ff]/50 to-transparent"></div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12">
              Why Choose <span className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">StepperGO</span>?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 - Cyan accent */}
              <div className="bg-[#1a1a1a]/80 backdrop-blur-sm p-8 rounded-2xl border border-[#00f0ff]/20 hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 group">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00f0ff] transition-colors">Real-time Pricing</h3>
                <p className="text-[#b3b3b3] leading-relaxed">
                  Price drops as more people join your trip. Save up to 70% on private trips.
                </p>
              </div>

              {/* Card 2 - Purple accent */}
              <div className="bg-[#1a1a1a]/80 backdrop-blur-sm p-8 rounded-2xl border border-[#cc00ff]/20 hover:border-[#cc00ff]/60 hover:shadow-[0_0_30px_rgba(204,0,255,0.2)] transition-all duration-300 group">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#cc00ff] transition-colors">Verified Drivers</h3>
                <p className="text-[#b3b3b3] leading-relaxed">
                  All drivers thoroughly vetted, background checked, and rated by passengers.
                </p>
              </div>

              {/* Card 3 - Green accent */}
              <div className="bg-[#1a1a1a]/80 backdrop-blur-sm p-8 rounded-2xl border border-[#00ff88]/20 hover:border-[#00ff88]/60 hover:shadow-[0_0_30px_rgba(0,255,136,0.2)] transition-all duration-300 group">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00ff88] transition-colors">Easy Communication</h3>
                <p className="text-[#b3b3b3] leading-relaxed">
                  WhatsApp groups for every trip. Connect with fellow travelers instantly.
                </p>
              </div>
            </div>

            {/* Registration CTA Buttons - Neon Gaming Style */}
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
              <Link
                href="/auth/register"
                className="bg-[#00f0ff] text-[#0a0a0a] px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:scale-105 transition-all duration-300 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Register as Passenger
              </Link>
              <Link
                href="/admin/drivers/new"
                className="bg-transparent border-2 border-[#00f0ff] text-[#00f0ff] px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:bg-[#00f0ff]/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Register as Driver
              </Link>
              <Link
                href="/trips/create?bookingType=private"
                className="bg-[#00ff88] text-[#0a0a0a] px-8 py-4 min-h-[48px] rounded-xl font-semibold text-lg hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] hover:scale-105 transition-all duration-300 min-w-[200px] text-center flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Register a Private Trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <PopularRoutesSection />
    </main>
  );
}
