'use client';

import Link from 'next/link';
import { popularRoutes, buildRouteUrl, formatRoutePrice, type PopularRoute } from '@/lib/config/popular-routes';
import { trackEvent } from '@/lib/analytics';

interface PopularRouteCardProps {
  route: PopularRoute;
}

/**
 * Individual route card component - Gaming Neon Style
 */
function PopularRouteCard({ route }: PopularRouteCardProps) {
  const isPrivate = route.bookingType === 'PRIVATE';
  
  const handleClick = () => {
    // Fire analytics event for route click
    trackEvent.popularRouteClicked({
      routeId: route.id,
      originCity: route.originCity,
      destinationCity: route.destinationCity,
      isPrivate,
      bookingType: route.bookingType,
    });
  };

  return (
    <Link
      href={buildRouteUrl(route)}
      onClick={handleClick}
      className="group bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#00f0ff]/20 p-6 min-h-[100px] rounded-2xl hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:border-[#00f0ff]/60 transition-all duration-300 hover:scale-105 flex flex-col justify-between"
    >
      <div>
        {/* Private badge - Neon Purple */}
        {isPrivate && (
          <span className="inline-block bg-[#cc00ff]/20 text-[#cc00ff] text-xs font-semibold px-2 py-1 rounded-full mb-3 border border-[#cc00ff]/30">
            🚗 Private Cab
          </span>
        )}
        
        {/* Route display */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-white group-hover:text-[#00f0ff] transition-colors">{route.originCity}</span>
          <span className="text-[#00f0ff]">→</span>
          <span className="text-lg font-semibold text-white group-hover:text-[#00f0ff] transition-colors">{route.destinationCity}</span>
        </div>
      </div>
      
      {/* Distance and price */}
      <div>
        <p className="text-sm text-[#808080] mb-2">{route.approxDistance}</p>
        <p className="text-[#00ff88] font-bold text-xl drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">{formatRoutePrice(route)}</p>
      </div>
    </Link>
  );
}

/**
 * Popular Routes Section - Gaming Dark Theme
 * Displays a grid of popular routes including private cab samples
 */
export function PopularRoutesSection() {
  return (
    <section className="py-16 md:py-24 bg-[#0a0a0a] relative overflow-hidden">
      {/* Neon accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff88]/50 to-transparent"></div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-4">
            Popular <span className="text-[#cc00ff] drop-shadow-[0_0_10px_rgba(204,0,255,0.5)]">Routes</span>
          </h2>
          <p className="text-center text-[#b3b3b3] mb-12 text-lg">
            Discover the most traveled destinations across Kazakhstan and Kyrgyzstan
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <PopularRouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
