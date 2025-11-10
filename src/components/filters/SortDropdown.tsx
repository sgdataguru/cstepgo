import { ArrowUpDown } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SortDropdownProps {
  currentSort: string;
  onSortChange: (option: SortOption) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  {
    value: 'date-asc',
    label: 'Date: Soonest First',
    sortBy: 'departureTime',
    sortOrder: 'asc',
  },
  {
    value: 'date-desc',
    label: 'Date: Latest First',
    sortBy: 'departureTime',
    sortOrder: 'desc',
  },
  {
    value: 'price-asc',
    label: 'Price: Low to High',
    sortBy: 'price',
    sortOrder: 'asc',
  },
  {
    value: 'price-desc',
    label: 'Price: High to Low',
    sortBy: 'price',
    sortOrder: 'desc',
  },
];

/**
 * SortDropdown - Dropdown for sorting trip results
 */
export default function SortDropdown({
  currentSort,
  onSortChange,
  className = '',
}: SortDropdownProps) {
  const selectedOption = sortOptions.find((opt) => opt.value === currentSort) || sortOptions[0];

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Sort By
      </label>
      <div className="relative">
        <select
          value={currentSort}
          onChange={(e) => {
            const option = sortOptions.find((opt) => opt.value === e.target.value);
            if (option) onSortChange(option);
          }}
          className="w-full appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
