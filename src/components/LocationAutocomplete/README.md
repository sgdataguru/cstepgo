# Location Autocomplete Component

A React component providing Google Places autocomplete functionality with TypeScript support.

## Features

- ✅ Google Places API integration
- ✅ Real-time autocomplete suggestions
- ✅ Country restrictions support
- ✅ Debounced search (300ms)
- ✅ Loading states
- ✅ Error handling
- ✅ Dark mode support
- ✅ Accessible (ARIA labels)
- ✅ TypeScript types
- ✅ Session token management (optimized billing)

## Installation

This component requires the following dependencies:

```bash
npm install @googlemaps/js-api-loader lucide-react
```

## Environment Setup

Add your Google Maps API key to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Usage

### Basic Example

```tsx
import LocationAutocomplete from '@/components/LocationAutocomplete';
import type { Location } from '@/hooks/useGooglePlaces';

function MyComponent() {
  const [location, setLocation] = useState<Location | null>(null);

  return (
    <LocationAutocomplete
      value={location}
      onChange={setLocation}
      placeholder="Search for a location..."
    />
  );
}
```

### With Country Restrictions

```tsx
<LocationAutocomplete
  value={location}
  onChange={setLocation}
  countryRestrictions={['sg', 'my', 'id', 'th']}
  placeholder="Search in Southeast Asia..."
/>
```

### With Type Restrictions

```tsx
// Only cities
<LocationAutocomplete
  value={location}
  onChange={setLocation}
  types={['(cities)']}
/>

// Only addresses
<LocationAutocomplete
  value={location}
  onChange={setLocation}
  types={['address']}
/>
```

### Form Integration

```tsx
<form onSubmit={handleSubmit}>
  <LocationAutocomplete
    value={location}
    onChange={setLocation}
    label="Pickup Location"
    required
    error={errors.location?.message}
  />
  <button type="submit">Submit</button>
</form>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Location \| null` | `null` | Selected location |
| `onChange` | `(location: Location \| null) => void` | - | Callback when location changes |
| `placeholder` | `string` | `"Search for a location..."` | Input placeholder text |
| `label` | `string` | - | Label text |
| `error` | `string` | - | Error message to display |
| `required` | `boolean` | `false` | Whether field is required |
| `countryRestrictions` | `string[]` | `['sg', 'my', 'id', 'th']` | ISO country codes |
| `types` | `string[]` | - | Place types filter |
| `className` | `string` | `''` | Additional CSS classes |

## Types

### Location

```typescript
interface Location {
  placeId: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

### PlaceSuggestion

```typescript
interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}
```

## Hooks

### useGooglePlaces

Low-level hook for Google Places API integration.

```typescript
const {
  isLoaded,
  getAutocompletePredictions,
  getPlaceDetails
} = useGooglePlaces(apiKey);
```

### useAutocomplete

High-level hook managing autocomplete state.

```typescript
const {
  query,
  suggestions,
  isOpen,
  isLoading,
  selectedLocation,
  error,
  handleQueryChange,
  handleSuggestionSelect,
  clearSelection
} = useAutocomplete({
  apiKey,
  countryRestrictions: ['sg'],
  debounceMs: 300
});
```

## Performance Optimization

### Session Tokens

The component automatically manages Google Places session tokens to optimize API billing. Each autocomplete session (search + selection) uses one token.

### Debouncing

Search queries are debounced (300ms default) to reduce API calls.

### Lazy Loading

Google Maps API is loaded only when needed.

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Error announcements

## Error Handling

The component handles:
- API loading failures
- Network errors
- Invalid API keys
- No results found
- Service unavailable

## Styling

The component uses Tailwind CSS and supports:
- Light/dark mode
- Custom themes via className
- Responsive design
- Hover/focus states

## Country Codes

Common Southeast Asian countries:
- `sg` - Singapore
- `my` - Malaysia
- `id` - Indonesia
- `th` - Thailand
- `ph` - Philippines
- `vn` - Vietnam
- `mm` - Myanmar

## Place Types

Common place types:
- `address` - Street addresses
- `(cities)` - Cities
- `(regions)` - Administrative regions
- `establishment` - Businesses and points of interest
- `geocode` - Geographic locations

See [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/supported_types) for full list.

## Troubleshooting

### "Cannot find module 'lucide-react'"

Install missing dependency:
```bash
npm install lucide-react
```

### "Google Maps API key is invalid"

1. Check your API key in `.env.local`
2. Enable Places API in Google Cloud Console
3. Add billing account to your project

### Suggestions not appearing

1. Check minimum search length (default: 3 characters)
2. Verify API key permissions
3. Check console for API errors

## Examples

See `Example.tsx` for a complete working example with:
- Start and end location selection
- Form validation
- Submit handling
- Debug output

## License

MIT
