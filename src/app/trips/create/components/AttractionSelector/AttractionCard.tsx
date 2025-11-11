'use client';

import Image from 'next/image';
import { Attraction } from '@/lib/zones';

interface AttractionCardProps {
  attraction: Attraction;
  isSelected: boolean;
  onToggle: (attractionId: string) => void;
}

export default function AttractionCard({ attraction, isSelected, onToggle }: AttractionCardProps) {
  const zoneColors = {
    A: 'bg-blue-100 text-blue-800',
    B: 'bg-green-100 text-green-800',
    C: 'bg-purple-100 text-purple-800',
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-primary-modernSg shadow-lg scale-[1.02]'
          : 'border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
      onClick={() => onToggle(attraction.id)}
    >
      {/* Image */}
      <div className="relative h-48 w-full bg-gray-200">
        {attraction.imageUrl ? (
          <Image
            src={attraction.imageUrl}
            alt={attraction.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Selection Checkbox Overlay */}
        <div className="absolute top-3 right-3">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
              isSelected
                ? 'bg-primary-modernSg border-primary-modernSg'
                : 'bg-white border-gray-300'
            }`}
          >
            {isSelected && (
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Zone Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${zoneColors[attraction.zone]}`}>
            Zone {attraction.zone}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1">{attraction.name}</h4>
        {attraction.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {attraction.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {attraction.estimatedDurationHours}h
          </div>
          
          {attraction.category && (
            <span className="text-gray-500 text-xs">
              {attraction.category}
            </span>
          )}
        </div>

        {attraction.address && (
          <div className="mt-2 flex items-start text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{attraction.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
