'use client';

import Link from 'next/link';
import { popularRoutes, buildRouteUrl, formatRoutePrice, type PopularRoute } from '@/lib/config/popular-routes';
import { trackEvent } from '@/lib/analytics';

interface PopularRouteCardProps {
  route: PopularRoute;
}

/**
 * Individual route card component
 */
function PopularRouteCard({ route }: PopularRouteCardProps) {
  const handleClick = () => {
    // Fire analytics event for route click
    trackEvent.popularRouteClicked({
      routeId: route.id,
      originCity: route.originCity,
      destinationCity: route.destinationCity,
      isPrivate: route.isPrivateSample,
      bookingType: route.bookingType,
    });
  };

  return (
    <Link
      href={buildRouteUrl(route)}
      onClick={handleClick}
      className="group bg-gradient-to-br from-neutral-light to-white border border-gray-200 p-6 min-h-[100px] rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col justify-between"
    >
      <div>
        {/* Private badge */}
        {route.isPrivateSample && (
          <span className="inline-block bg-primary-modernSg/10 text-primary-modernSg text-xs font-semibold px-2 py-1 rounded-full mb-3">
            🚗 Private Cab
          </span>
        )}
        
        {/* Route display */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-gray-900">{route.originCity}</span>
          <span className="text-primary-modernSg">→</span>
          <span className="text-lg font-semibold text-gray-900">{route.destinationCity}</span>
        </div>
      </div>
      
      {/* Distance and price */}
      <div>
        <p className="text-sm text-gray-600 mb-2">{route.approxDistance}</p>
        <p className="text-primary-accent font-bold text-xl">{formatRoutePrice(route)}</p>
      </div>
    </Link>
  );
}

/**
 * Popular Routes Section
 * Displays a grid of popular routes including private cab samples
 */
export function PopularRoutesSection() {
  return (
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
              <PopularRouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
