import { Trip } from '@/types/trip-types';

interface TripListingSchemaProps {
  trips: Trip[];
}

/**
 * Generate Schema.org structured data for trip listings
 * Helps search engines understand trip information for better SEO
 */
export default function TripListingSchema({ trips }: TripListingSchemaProps) {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Available Trips',
    description: 'Browse shared group trips across Kazakhstan and Kyrgyzstan',
    numberOfItems: trips.length,
    itemListElement: trips.slice(0, 10).map((trip, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristTrip',
        '@id': `https://steppergo.com/trips/${trip.id}`,
        name: trip.title,
        description: trip.description,
        itinerary: {
          '@type': 'ItemList',
          itemListElement: [
            {
              '@type': 'Place',
              name: trip.location.origin.name,
              address: trip.location.origin.address,
            },
            {
              '@type': 'Place',
              name: trip.location.destination.name,
              address: trip.location.destination.address,
            },
          ],
        },
        offers: {
          '@type': 'Offer',
          price: trip.pricing.pricePerPerson,
          priceCurrency: trip.pricing.currency,
          availability: trip.capacity.available > 0 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          url: `https://steppergo.com/trips/${trip.id}`,
        },
        startDate: new Date(trip.departureTime).toISOString(),
        endDate: new Date(trip.returnTime).toISOString(),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
  );
}
