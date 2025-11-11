'use client';

import { Zone, ZONE_CONFIG } from '@/lib/zones';

interface ZoneSelectorProps {
  selectedZone: Zone | 'ALL';
  onZoneChange: (zone: Zone | 'ALL') => void;
}

export default function ZoneSelector({ selectedZone, onZoneChange }: ZoneSelectorProps) {
  const zones = [
    { value: 'ALL' as const, label: 'All Zones', description: 'Browse all attractions' },
    { value: Zone.A, label: 'Zone A', description: ZONE_CONFIG[Zone.A].description },
    { value: Zone.B, label: 'Zone B', description: ZONE_CONFIG[Zone.B].description },
    { value: Zone.C, label: 'Zone C', description: ZONE_CONFIG[Zone.C].description },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Zone</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => (
          <button
            key={zone.value}
            onClick={() => onZoneChange(zone.value)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedZone === zone.value
                ? 'border-primary-modernSg bg-primary-modernSg/10'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`font-semibold ${
                selectedZone === zone.value ? 'text-primary-modernSg' : 'text-gray-900'
              }`}>
                {zone.label}
              </span>
              {selectedZone === zone.value && (
                <span className="text-primary-modernSg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{zone.description}</p>
            {zone.value !== 'ALL' && (
              <div className="mt-2 text-xs text-gray-500">
                {ZONE_CONFIG[zone.value as Zone].radiusMin}-
                {ZONE_CONFIG[zone.value as Zone].radiusMax}km
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
