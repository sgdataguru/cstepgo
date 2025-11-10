'use client';

import { Attraction, Zone } from '@/lib/zones';
import AttractionCard from './AttractionCard';

interface AttractionListProps {
  attractions: Attraction[];
  selectedAttractionIds: string[];
  onToggleAttraction: (attractionId: string) => void;
  selectedZone: Zone | 'ALL';
}

export default function AttractionList({
  attractions,
  selectedAttractionIds,
  onToggleAttraction,
  selectedZone,
}: AttractionListProps) {
  // Filter by zone if not ALL
  const filteredAttractions = selectedZone === 'ALL'
    ? attractions
    : attractions.filter(a => a.zone === selectedZone);

  // Group by zone for better organization
  const groupedAttractions = filteredAttractions.reduce((acc, attraction) => {
    if (!acc[attraction.zone]) {
      acc[attraction.zone] = [];
    }
    acc[attraction.zone].push(attraction);
    return acc;
  }, {} as Record<Zone, Attraction[]>);

  const zoneOrder: Zone[] = [Zone.A, Zone.B, Zone.C];
  const displayZones = selectedZone === 'ALL'
    ? zoneOrder.filter(zone => groupedAttractions[zone]?.length > 0)
    : [selectedZone as Zone];

  if (filteredAttractions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attractions found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try selecting a different zone or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {displayZones.map((zone) => (
        <div key={zone}>
          {selectedZone === 'ALL' && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Zone {zone} - {zone === Zone.A ? 'City Center' : zone === Zone.B ? 'Suburban' : 'Regional'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({groupedAttractions[zone]?.length || 0} attractions)
              </span>
            </h3>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(groupedAttractions[zone] || []).map((attraction) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                isSelected={selectedAttractionIds.includes(attraction.id)}
                onToggle={onToggleAttraction}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
