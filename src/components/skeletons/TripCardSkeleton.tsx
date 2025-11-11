/**
 * TripCardSkeleton - Loading skeleton for trip cards
 */
export default function TripCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 w-full -mx-6 -mt-6 mb-4 bg-gray-200 dark:bg-gray-700" />

      {/* Content skeleton */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>

        {/* Location */}
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>

        {/* Date */}
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>

        {/* Pricing */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * TripListingSkeleton - Loading skeleton for the entire trip listing grid
 */
export function TripListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  );
}
