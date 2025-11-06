# Landing Page UI Specification - FlixBus-Inspired Design

## Overview
The StepperGO landing page features a modern, conversion-optimized search interface inspired by FlixBus, with a scenic hero image and prominent search widget for immediate trip discovery.

---

## Design Reference
**Inspiration:** FlixBus landing page (attached image)
**Key Elements:**
- Full-width hero image with overlay
- Centered search widget with lime green CTA
- Private/Share booking toggle (StepperGO unique feature)
- Clean, minimal interface focused on trip search

---

## Component Breakdown

### 1. Hero Section (Full Viewport Height)

#### Hero Image
```typescript
interface HeroImageProps {
  src: string;              // "/images/hero-bus-highway.jpg"
  alt: string;              // "Low cost bus travel across Central Asia"
  overlay: {
    gradient: string;       // "linear-gradient(to bottom, rgba(0,194,176,0.3), rgba(255,107,107,0.2))"
    opacity: number;        // 0.4 (adjustable for text readability)
  };
}
```

**Image Requirements:**
- **Subject:** Modern bus on scenic highway (Central Asian landscape preferred)
- **Dimensions:** 1920x1080px minimum (responsive scaling)
- **Format:** WebP with JPEG fallback
- **Optimization:** Next.js Image component with priority loading
- **Position:** Cover with center alignment
- **Overlay:** Teal-to-pink gradient (brand colors: #00C2B0 to #FF6B6B)

**Example:**
```tsx
<div className="relative h-screen">
  <Image
    src="/images/hero-bus-highway.jpg"
    alt="Low cost bus travel across Central Asia"
    fill
    className="object-cover"
    priority
    quality={90}
  />
  <div className="absolute inset-0 bg-gradient-to-b from-primary-modernSg/30 to-primary-peranakan/20" />
</div>
```

---

### 2. Search Widget (Centered Overlay)

#### Container Styling
```typescript
interface SearchWidgetStyles {
  position: "absolute";       // Centered on hero image
  top: "50%";
  left: "50%";
  transform: "translate(-50%, -50%)";
  background: "rgba(255, 255, 255, 0.95)";  // Frosted glass effect
  backdropFilter: "blur(8px)";
  borderRadius: "24px";
  padding: {
    mobile: "24px";
    desktop: "32px";
  };
  width: {
    mobile: "90%";
    tablet: "600px";
    desktop: "700px";
  };
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)";
}
```

---

### 3. Tag Line ("Low cost bus travel")

**Position:** Top of search widget  
**Typography:**
```typescript
interface TagLineStyles {
  fontFamily: '"Space Grotesk", sans-serif';  // Display font
  fontSize: {
    mobile: "18px";
    desktop: "24px";
  };
  fontWeight: 600;
  color: "#212529";                           // Neutral dark
  marginBottom: "24px";
  textAlign: "left";
}
```

**Text:** "Low cost bus travel" (or "Affordable group travel across Central Asia")

---

### 4. Private/Share Toggle (Radio Buttons)

#### Design Specs
```typescript
interface BookingToggleProps {
  options: ["Private", "Share"];
  defaultSelected: "Private";
  onChange: (value: "Private" | "Share") => void;
}

interface ToggleStyles {
  display: "flex";
  gap: "16px";
  marginBottom: "24px";
  
  radioButton: {
    appearance: "none";                     // Custom styled
    width: "24px";
    height: "24px";
    borderRadius: "50%";
    border: "2px solid #00C2B0";           // Teal border
    position: "relative";
    cursor: "pointer";
    
    // Selected state
    checkedBackground: "#00C2B0";          // Teal fill
    checkedInnerCircle: "8px white circle";
  };
  
  label: {
    fontSize: "16px";
    fontWeight: 500;
    color: "#212529";
    cursor: "pointer";
    display: "flex";
    alignItems: "center";
    gap: "8px";
  };
}
```

**Layout:**
```tsx
<div className="flex gap-6 mb-6">
  <label className="flex items-center gap-2 cursor-pointer">
    <input 
      type="radio" 
      name="bookingType" 
      value="Private"
      className="w-6 h-6 accent-primary-modernSg"
      defaultChecked
    />
    <span className="font-medium">Private</span>
  </label>
  
  <label className="flex items-center gap-2 cursor-pointer">
    <input 
      type="radio" 
      name="bookingType" 
      value="Share"
      className="w-6 h-6 accent-primary-modernSg"
    />
    <span className="font-medium">Share</span>
  </label>
</div>
```

---

### 5. Location Inputs (From/To with Swap)

#### From Input
```typescript
interface LocationInputProps {
  label: "From";
  placeholder: "Hamburg" | "Almaty";       // Example city
  icon: "MapPin" | "Locate";               // Lucide icons
  autocomplete: boolean;                    // Enable autocomplete
  suggestions: FamousLocation[];            // 40+ famous locations
  value: string;
  onChange: (value: string) => void;
}

interface LocationInputStyles {
  container: {
    position: "relative";
    marginBottom: "16px";
  };
  
  label: {
    fontSize: "14px";
    fontWeight: 500;
    color: "#495057";
    marginBottom: "8px";
    display: "block";
  };
  
  input: {
    width: "100%";
    height: "56px";
    paddingLeft: "48px";                   // Space for icon
    paddingRight: "16px";
    fontSize: "16px";
    border: "2px solid #DEE2E6";           // Light gray
    borderRadius: "12px";
    backgroundColor: "#F8F9FA";
    transition: "border-color 0.2s ease";
    
    // Focus state
    focusBorder: "2px solid #00C2B0";      // Teal
    focusBoxShadow: "0 0 0 3px rgba(0,194,176,0.1)";
  };
  
  icon: {
    position: "absolute";
    left: "16px";
    top: "50%";
    transform: "translateY(-50%)";
    color: "#6C757D";                      // Gray
    size: "20px";
  };
}
```

#### Swap Button (Between Inputs)
```typescript
interface SwapButtonProps {
  icon: "ArrowUpDown";                     // Lucide icon
  onClick: () => void;                     // Swap from/to values
  ariaLabel: "Swap locations";
}

interface SwapButtonStyles {
  position: "absolute";
  right: "-20px";                          // Between inputs
  top: "50%";
  transform: "translateY(-50%)";
  width: "40px";
  height: "40px";
  borderRadius: "50%";
  backgroundColor: "#FFFFFF";
  border: "2px solid #DEE2E6";
  display: "flex";
  alignItems: "center";
  justifyContent: "center";
  cursor: "pointer";
  transition: "all 0.2s ease";
  
  // Hover state
  hoverBackground: "#00C2B0";              // Teal
  hoverBorder: "#00C2B0";
  hoverIconColor: "#FFFFFF";
  hoverTransform: "translateY(-50%) rotate(180deg)";
}
```

**Layout:**
```tsx
<div className="relative">
  {/* From Input */}
  <div className="mb-4">
    <label className="text-sm font-medium text-gray-700 mb-2 block">From</label>
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      <input
        type="text"
        placeholder="Hamburg"
        className="w-full h-14 pl-12 pr-4 text-base border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-primary-modernSg focus:ring-2 focus:ring-primary-modernSg/10"
      />
    </div>
  </div>
  
  {/* Swap Button */}
  <button 
    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-primary-modernSg hover:border-primary-modernSg hover:rotate-180 transition-all"
    aria-label="Swap locations"
  >
    <ArrowUpDown size={18} />
  </button>
  
  {/* To Input */}
  <div>
    <label className="text-sm font-medium text-gray-700 mb-2 block">To</label>
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      <input
        type="text"
        placeholder="Berlin"
        className="w-full h-14 pl-12 pr-4 text-base border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-primary-modernSg focus:ring-2 focus:ring-primary-modernSg/10"
      />
    </div>
  </div>
</div>
```

---

### 6. Departure Date Picker

```typescript
interface DatePickerProps {
  label: "Departure";
  defaultValue: Date;                      // Today
  minDate: Date;                           // Today (no past dates)
  maxDate: Date;                           // 6 months from today
  icon: "Calendar";                        // Lucide icon
  onChange: (date: Date) => void;
}

interface DatePickerStyles {
  container: {
    marginBottom: "16px";
  };
  
  label: {
    fontSize: "14px";
    fontWeight: 500;
    color: "#495057";
    marginBottom: "8px";
    display: "block";
  };
  
  input: {
    width: "100%";
    height: "56px";
    paddingLeft: "48px";                   // Space for calendar icon
    paddingRight: "48px";                  // Space for dropdown arrows
    fontSize: "16px";
    border: "2px solid #DEE2E6";
    borderRadius: "12px";
    backgroundColor: "#F8F9FA";
    cursor: "pointer";
    
    // Focus state
    focusBorder: "2px solid #00C2B0";
    focusBoxShadow: "0 0 0 3px rgba(0,194,176,0.1)";
  };
  
  calendarIcon: {
    position: "absolute";
    left: "16px";
    top: "50%";
    transform: "translateY(-50%)";
    color: "#6C757D";
    size: "20px";
  };
  
  navigationArrows: {
    position: "absolute";
    right: "16px";
    top: "50%";
    transform: "translateY(-50%)";
    display: "flex";
    gap: "4px";
  };
}
```

**Display Format:**
- **Today:** "Today, 5 Nov" (bold "Today")
- **Tomorrow:** "Tomorrow, 6 Nov"
- **Other:** "Fri, 8 Nov" (short weekday + date)

**Example:**
```tsx
<div className="mb-4">
  <label className="text-sm font-medium text-gray-700 mb-2 block">Departure</label>
  <div className="relative">
    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
    <input
      type="text"
      value="Today, 5 Nov"
      readOnly
      className="w-full h-14 pl-12 pr-20 text-base border-2 border-gray-300 rounded-xl bg-gray-50 cursor-pointer"
    />
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
      <ChevronLeft size={18} className="text-gray-500" />
      <ChevronRight size={18} className="text-gray-500" />
    </div>
  </div>
</div>
```

---

### 7. Passenger Selector (Dropdown)

```typescript
interface PassengerSelectorProps {
  label: "Passengers";
  defaultValue: 1;
  maxPassengers: {
    private: 13;                           // Bus capacity
    shared: 4;                             // Per booking limit
  };
  value: number;
  onChange: (count: number) => void;
}

interface PassengerSelectorStyles {
  container: {
    marginBottom: "24px";
  };
  
  label: {
    fontSize: "14px";
    fontWeight: 500;
    color: "#495057";
    marginBottom: "8px";
    display: "block";
  };
  
  dropdown: {
    width: "100%";
    height: "56px";
    paddingLeft: "16px";
    paddingRight: "48px";                  // Space for chevron
    fontSize: "16px";
    border: "2px solid #DEE2E6";
    borderRadius: "12px";
    backgroundColor: "#F8F9FA";
    cursor: "pointer";
    appearance: "none";                    // Remove default dropdown arrow
    
    // Focus state
    focusBorder: "2px solid #00C2B0";
    focusBoxShadow: "0 0 0 3px rgba(0,194,176,0.1)";
  };
  
  chevronIcon: {
    position: "absolute";
    right: "16px";
    top: "50%";
    transform: "translateY(-50%)";
    color: "#6C757D";
    size: "20px";
    pointerEvents: "none";
  };
}
```

**Dropdown Options:**
- **Private Mode:** "1 Adult", "2 Adults", ..., "13 Adults"
- **Shared Mode:** "1 Adult", "2 Adults", "3 Adults", "4 Adults" (max)

**Example:**
```tsx
<div className="mb-6">
  <label className="text-sm font-medium text-gray-700 mb-2 block">Passengers</label>
  <div className="relative">
    <select className="w-full h-14 px-4 pr-12 text-base border-2 border-gray-300 rounded-xl bg-gray-50 appearance-none cursor-pointer">
      <option value="1">1 Adult</option>
      <option value="2">2 Adults</option>
      <option value="3">3 Adults</option>
      <option value="4">4 Adults</option>
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
  </div>
</div>
```

---

### 8. Search Button (CTA)

```typescript
interface SearchButtonProps {
  text: "Search";
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface SearchButtonStyles {
  width: "100%";
  height: "60px";
  fontSize: "18px";
  fontWeight: 600;
  backgroundColor: "#A4D233";              // Lime green (FlixBus style)
  color: "#212529";                        // Dark text for contrast
  border: "none";
  borderRadius: "12px";
  cursor: "pointer";
  transition: "all 0.2s ease";
  boxShadow: "0 4px 12px rgba(164,210,51,0.3)";
  
  // Hover state
  hoverBackground: "#8FBD28";              // Darker lime
  hoverBoxShadow: "0 6px 20px rgba(164,210,51,0.4)";
  hoverTransform: "translateY(-2px)";
  
  // Active state
  activeTransform: "translateY(0)";
  activeBoxShadow: "0 2px 8px rgba(164,210,51,0.3)";
  
  // Disabled state
  disabledBackground: "#DEE2E6";           // Gray
  disabledColor: "#6C757D";
  disabledCursor: "not-allowed";
}
```

**Example:**
```tsx
<button 
  className="w-full h-[60px] text-lg font-semibold bg-[#A4D233] text-gray-900 rounded-xl hover:bg-[#8FBD28] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
  onClick={handleSearch}
>
  Search
</button>
```

---

## Responsive Behavior

### Mobile (320px - 767px)
```typescript
interface MobileLayout {
  searchWidget: {
    width: "90%";                          // Full width minus padding
    padding: "20px";
    borderRadius: "16px";                  // Slightly smaller radius
  };
  
  inputs: {
    height: "52px";                        // Slightly smaller
    fontSize: "16px";                      // Prevent zoom on iOS
  };
  
  tagLine: {
    fontSize: "16px";
    marginBottom: "16px";
  };
  
  searchButton: {
    height: "56px";
    fontSize: "17px";
  };
  
  swapButton: {
    display: "none";                       // Hide swap, stack inputs vertically
  };
}
```

**Layout Changes:**
- Inputs stack vertically (no side-by-side)
- Swap button hidden (use simple vertical layout)
- Radio buttons remain horizontal
- Reduced spacing for mobile viewport

---

### Tablet (768px - 1023px)
```typescript
interface TabletLayout {
  searchWidget: {
    width: "600px";
    padding: "28px";
  };
  
  inputs: {
    height: "56px";
    fontSize: "16px";
  };
  
  swapButton: {
    display: "flex";                       // Show swap button
  };
}
```

---

### Desktop (1024px+)
```typescript
interface DesktopLayout {
  searchWidget: {
    width: "700px";
    padding: "32px";
  };
  
  inputs: {
    height: "56px";
    fontSize: "16px";
  };
  
  // Enhanced hover effects on desktop
  interactivity: {
    swapButtonRotation: "180deg";          // Rotate on hover
    inputScaleOnFocus: 1.02;               // Subtle scale
  };
}
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
```typescript
interface KeyboardSupport {
  tabOrder: [
    "Private/Share toggle",
    "From input",
    "To input",
    "Swap button",
    "Departure date",
    "Passenger dropdown",
    "Search button"
  ];
  
  shortcuts: {
    "Tab": "Navigate forward",
    "Shift+Tab": "Navigate backward",
    "Enter": "Submit search / Select dropdown",
    "Space": "Toggle radio / Open date picker",
    "Arrow keys": "Navigate date picker / dropdown",
    "Escape": "Close date picker / dropdown"
  };
}
```

### ARIA Labels
```tsx
// Radio buttons
<input 
  type="radio" 
  name="bookingType" 
  value="Private"
  aria-label="Book entire vehicle (Private)"
/>

// Swap button
<button 
  aria-label="Swap origin and destination cities"
  aria-describedby="swap-hint"
>
  <ArrowUpDown />
</button>

// Search button
<button 
  aria-label="Search available trips"
  aria-busy={isLoading}
>
  Search
</button>
```

### Color Contrast
- **Text on White Background:** 
  - Body text (#212529): 16.1:1 (AAA)
  - Labels (#495057): 8.9:1 (AAA)
  - Icons (#6C757D): 5.7:1 (AA)
- **Search Button:** 
  - Text (#212529) on Lime (#A4D233): 7.2:1 (AA)
- **Focus Indicators:** 
  - Teal ring (2px solid #00C2B0): 4.8:1 (AA)

---

## State Management

### Form State
```typescript
interface SearchFormState {
  bookingType: "Private" | "Share";
  origin: {
    city: string;
    latitude?: number;
    longitude?: number;
  };
  destination: {
    city: string;
    latitude?: number;
    longitude?: number;
  };
  departureDate: Date;
  passengers: number;
  
  // UI state
  isSearching: boolean;
  errors: {
    origin?: string;
    destination?: string;
    date?: string;
  };
}
```

### Validation Rules
```typescript
interface ValidationRules {
  origin: {
    required: true;
    minLength: 2;
    errorMessage: "Please select a departure city";
  };
  
  destination: {
    required: true;
    minLength: 2;
    differentFrom: "origin";                // Cannot be same as origin
    errorMessage: "Please select a different destination";
  };
  
  departureDate: {
    required: true;
    minDate: "today";
    maxDate: "today + 6 months";
    errorMessage: "Please select a valid departure date";
  };
  
  passengers: {
    required: true;
    min: 1;
    max: {
      private: 13;
      shared: 4;
    };
    errorMessage: "Invalid passenger count";
  };
}
```

---

## Integration Points

### Location Autocomplete (Epic A.3)
```typescript
// API call
GET /api/locations/autocomplete?q=Alma

// Response
{
  "suggestions": [
    {
      "id": "almaty-city",
      "name": "Almaty",
      "type": "CITY",
      "country": "Kazakhstan",
      "latitude": 43.2220,
      "longitude": 76.8512,
      "isFamous": true
    },
    {
      "id": "almaty-tower",
      "name": "Almaty Tower",
      "type": "LANDMARK",
      "country": "Kazakhstan",
      ...
    }
  ]
}
```

**Autocomplete Behavior:**
1. Debounce input: 300ms
2. Minimum characters: 2
3. Display famous locations first (40+ curated)
4. Fallback to Mapbox API if no local matches
5. Show max 8 suggestions
6. Highlight matching text

---

### Trip Search Redirect
```typescript
// On search button click
const handleSearch = () => {
  const params = new URLSearchParams({
    origin_city: origin.city,
    destination_city: destination.city,
    departure_date: departureDate.toISOString(),
    is_private: bookingType === "Private" ? "true" : "false",
    passengers: passengers.toString()
  });
  
  router.push(`/trips?${params.toString()}`);
};
```

**Redirect Flow:**
1. Validate form inputs
2. Build query string
3. Navigate to `/trips` page (Epic A.1)
4. Trip listing page filters based on params
5. Display urgency badges, pricing, etc.

---

## Performance Optimization

### Image Loading
```tsx
<Image
  src="/images/hero-bus-highway.jpg"
  alt="Low cost bus travel"
  fill
  priority                                 // Load immediately
  quality={90}                             // Balance quality/size
  placeholder="blur"                       // Show blur while loading
  blurDataURL={blurDataURL}               // Base64 blur placeholder
/>
```

### Component Code-Splitting
```tsx
// Lazy load date picker (only when needed)
const DatePicker = dynamic(() => import('@/components/DatePicker'), {
  loading: () => <Skeleton height={56} />,
  ssr: false                               // Client-side only
});
```

### Autocomplete Debouncing
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  async (query: string) => {
    const results = await fetch(`/api/locations/autocomplete?q=${query}`);
    setSuggestions(results);
  },
  300                                      // 300ms delay
);
```

---

## Success Metrics

### Conversion Tracking (PostHog)
```typescript
// Track search interactions
posthog.capture('landing_search_started', {
  bookingType: formState.bookingType,
  origin: formState.origin.city,
  destination: formState.destination.city
});

posthog.capture('landing_search_completed', {
  bookingType: formState.bookingType,
  passengers: formState.passengers,
  timeToComplete: performance.now() - searchStartTime
});
```

### Target Metrics (30 days post-launch)
- **Search completion rate:** >70% (users who fill all fields)
- **Time to search:** <30 seconds average
- **Autocomplete usage:** >60% of users select from suggestions
- **Private vs Share ratio:** Track booking type preference
- **Mobile search rate:** >50% of searches from mobile devices

---

## Implementation Checklist

### Phase 1: Core Components (Week 1)
- [ ] Create `HeroSection.tsx` component
- [ ] Implement `SearchWidget.tsx` with form state
- [ ] Add `PrivateShareToggle.tsx` radio buttons
- [ ] Build `LocationInput.tsx` with icon
- [ ] Create `SwapButton.tsx` with rotation animation

### Phase 2: Advanced Inputs (Week 1-2)
- [ ] Integrate date picker library (react-day-picker)
- [ ] Build `PassengerSelector.tsx` dropdown
- [ ] Implement form validation with Zod
- [ ] Add error messaging UI

### Phase 3: Autocomplete Integration (Week 2)
- [ ] Connect location autocomplete API
- [ ] Implement debounced search
- [ ] Style autocomplete dropdown
- [ ] Add keyboard navigation (arrow keys)

### Phase 4: Responsive & Polish (Week 2-3)
- [ ] Implement mobile layout (stacked inputs)
- [ ] Test tablet breakpoint
- [ ] Add loading states (search button spinner)
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Add PostHog analytics events

### Phase 5: Testing (Week 3)
- [ ] Unit tests (form validation logic)
- [ ] E2E test (full search flow with Playwright)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance audit (Lighthouse score >90)

---

## Code Example: Complete Search Widget Component

```tsx
// components/landing/SearchWidget.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ChevronDown, ArrowUpDown } from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { DatePicker } from './DatePicker';

interface SearchFormData {
  bookingType: 'Private' | 'Share';
  origin: string;
  destination: string;
  departureDate: Date;
  passengers: number;
}

export function SearchWidget() {
  const router = useRouter();
  const [formData, setFormData] = useState<SearchFormData>({
    bookingType: 'Private',
    origin: '',
    destination: '',
    departureDate: new Date(),
    passengers: 1
  });

  const handleSwapLocations = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const handleSearch = () => {
    // Validate form
    if (!formData.origin || !formData.destination) {
      alert('Please select both origin and destination');
      return;
    }

    // Build query params
    const params = new URLSearchParams({
      origin_city: formData.origin,
      destination_city: formData.destination,
      departure_date: formData.departureDate.toISOString().split('T')[0],
      is_private: (formData.bookingType === 'Private').toString(),
      passengers: formData.passengers.toString()
    });

    // Redirect to trips listing
    router.push(`/trips?${params.toString()}`);
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[600px] lg:w-[700px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8">
      {/* Tag Line */}
      <h2 className="text-xl md:text-2xl font-display font-semibold mb-6">
        Low cost bus travel
      </h2>

      {/* Private/Share Toggle */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="bookingType"
            value="Private"
            checked={formData.bookingType === 'Private'}
            onChange={(e) => setFormData({ ...formData, bookingType: 'Private' })}
            className="w-6 h-6 accent-primary-modernSg"
          />
          <span className="font-medium">Private</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="bookingType"
            value="Share"
            checked={formData.bookingType === 'Share'}
            onChange={(e) => setFormData({ ...formData, bookingType: 'Share' })}
            className="w-6 h-6 accent-primary-modernSg"
          />
          <span className="font-medium">Share</span>
        </label>
      </div>

      {/* Location Inputs */}
      <div className="relative mb-6">
        {/* From Input */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">From</label>
          <LocationAutocomplete
            value={formData.origin}
            onChange={(value) => setFormData({ ...formData, origin: value })}
            placeholder="Hamburg"
            icon={<MapPin size={20} />}
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwapLocations}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-primary-modernSg hover:border-primary-modernSg hover:rotate-180 transition-all z-10"
          aria-label="Swap locations"
        >
          <ArrowUpDown size={18} />
        </button>

        {/* To Input */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">To</label>
          <LocationAutocomplete
            value={formData.destination}
            onChange={(value) => setFormData({ ...formData, destination: value })}
            placeholder="Berlin"
            icon={<MapPin size={20} />}
          />
        </div>
      </div>

      {/* Departure Date */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Departure</label>
        <DatePicker
          value={formData.departureDate}
          onChange={(date) => setFormData({ ...formData, departureDate: date })}
          icon={<Calendar size={20} />}
        />
      </div>

      {/* Passengers */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Passengers</label>
        <div className="relative">
          <select
            value={formData.passengers}
            onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
            className="w-full h-14 px-4 pr-12 text-base border-2 border-gray-300 rounded-xl bg-gray-50 appearance-none cursor-pointer focus:border-primary-modernSg focus:ring-2 focus:ring-primary-modernSg/10"
          >
            {Array.from({ length: formData.bookingType === 'Private' ? 13 : 4 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Adult' : 'Adults'}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full h-[60px] text-lg font-semibold bg-[#A4D233] text-gray-900 rounded-xl hover:bg-[#8FBD28] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
      >
        Search
      </button>
    </div>
  );
}
```

---

## Visual Design Assets Needed

### Hero Image
- **Filename:** `hero-bus-highway.jpg`
- **Dimensions:** 1920x1080px (16:9 ratio)
- **Subject:** Modern bus on scenic highway
- **Location:** Central Asian landscape (Kazakhstan/Kyrgyzstan preferred)
- **Mood:** Adventure, travel, freedom
- **Colors:** Natural landscape colors (blue sky, green/brown terrain)
- **Stock Photo Sources:** Unsplash, Pexels (search: "bus highway Kazakhstan")

### Icons (Lucide React)
- **MapPin:** Location inputs
- **Calendar:** Date picker
- **ChevronDown:** Dropdown indicators
- **ChevronLeft/Right:** Date navigation
- **ArrowUpDown:** Swap button
- **Users:** Passenger selector (optional)

### Color Palette
```typescript
export const landingPageColors = {
  // Primary brand colors
  teal: '#00C2B0',                         // Primary CTA hover, focus states
  pink: '#FF6B6B',                         // Gradient accent
  
  // Search button (FlixBus style)
  limeGreen: '#A4D233',                    // Primary CTA background
  limeGreenDark: '#8FBD28',                // CTA hover state
  
  // Neutral grays
  darkText: '#212529',                     // Body text, button text
  mediumGray: '#495057',                   // Labels
  lightGray: '#6C757D',                    // Icons, placeholders
  borderGray: '#DEE2E6',                   // Input borders
  backgroundGray: '#F8F9FA',               // Input backgrounds
  white: '#FFFFFF',                        // Widget background
  
  // Gradients
  heroOverlay: 'linear-gradient(to bottom, rgba(0,194,176,0.3), rgba(255,107,107,0.2))',
};
```

---

## Notes & Considerations

1. **FlixBus vs StepperGO Differentiation:**
   - Keep lime green search button (high-converting CTA color)
   - Add Private/Share toggle (unique StepperGO feature)
   - Use teal brand color for focus/hover states (maintain brand identity)

2. **Central Asia Localization:**
   - Use Cyrillic-friendly fonts (Inter, Space Grotesk support Cyrillic)
   - Autocomplete includes 40+ famous KZ/KG locations
   - Example cities: Almaty, Bishkek, Nur-Sultan, Osh, Shymkent

3. **Conversion Optimization:**
   - "Low cost bus travel" tagline emphasizes value proposition
   - Lime green CTA creates high contrast (proven FlixBus pattern)
   - Private/Share toggle at top (prioritizes decision early)
   - Minimal form fields (reduce friction)

4. **Future Enhancements:**
   - Add "Flexible dates" toggle (±3 days search)
   - Multi-city trip builder (stop-over support)
   - Recent searches dropdown
   - "Popular routes" suggestions below search widget

---

**Status:** ✅ READY FOR IMPLEMENTATION  
**Epic:** Epic A.1 (View Trip Urgency Status)  
**Priority:** HIGH (landing page is first user touchpoint)  
**Estimated Effort:** 2-3 weeks (includes autocomplete integration, responsive design, testing)

