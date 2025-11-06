# Landing Page Implementation - Quick Start Guide

## 🎯 Overview
FlixBus-inspired landing page with hero image, centered search widget, and Turquoise Glod CTA.

---

## 📸 Visual Reference
Based on attached FlixBus screenshot showing:
- Full-width hero image (Car on highway)
- Centered white search widget with frosted glass effect
- "Low cost bus travel" tagline
- Private/Share toggle (unique to StepperGO)
- Location inputs with swap button
- Date picker and passenger selector
- Gold search button

---

## 🚀 Quick Implementation Steps

### 1. Hero Image Setup (5 minutes)
```tsx
// src/app/page.tsx
<div className="relative h-screen">
  <Image
    src="/images/hero-bus-highway.jpg"
    alt="Low cost bus travel across Central Asia"
    fill
    className="object-cover"
    priority
  />
  <div className="absolute inset-0 bg-gradient-to-b from-primary-modernSg/30 to-primary-peranakan/20" />
  
  {/* Search Widget Here */}
  <SearchWidget />
</div>
```

**Need:** `hero-bus-highway.jpg` (1920x1080px, scenic bus on highway)

---

### 2. Search Widget Component (30 minutes)
```tsx
// src/components/landing/SearchWidget.tsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[700px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
  <h2 className="text-2xl font-display font-semibold mb-6">
    Low cost bus travel
  </h2>
  
  {/* Form fields */}
</div>
```

---

### 3. Key Components

#### Private/Share Toggle
```tsx
<div className="flex gap-6 mb-6">
  <label className="flex items-center gap-2">
    <input type="radio" name="type" value="Private" defaultChecked />
    <span>Private</span>
  </label>
  <label className="flex items-center gap-2">
    <input type="radio" name="type" value="Share" />
    <span>Share</span>
  </label>
</div>
```

#### Location Inputs with Swap
```tsx
<div className="relative mb-6">
  {/* From */}
  <LocationInput label="From" placeholder="Hamburg" />
  
  {/* Swap Button */}
  <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-white border-2">
    <ArrowUpDown size={18} />
  </button>
  
  {/* To */}
  <LocationInput label="To" placeholder="Berlin" />
</div>
```

#### Search Button (Lime Green)
```tsx
<button className="w-full h-[60px] text-lg font-semibold bg-[#A4D233] text-gray-900 rounded-xl hover:bg-[#8FBD28]">
  Search
</button>
```

---

## 🎨 Key Colors

```typescript
const colors = {
    Turquoise:'#40E0D0',        // Search button (FlixBus style)
    Gold: '#FFD700',    // Button hover
    teal: '#00C2B0',             // Focus states (brand)
    pink: '#FF6B6B',             // Gradient accent (brand)
};
```

---

## 📦 Components Needed

1. ✅ `SearchWidget.tsx` - Main container
2. ✅ `LocationInput.tsx` - Autocomplete input with icon
3. ✅ `DatePicker.tsx` - Date selection
4. ✅ `PassengerSelector.tsx` - Dropdown
5. ✅ `SwapButton.tsx` - Location swap

---

## 📱 Responsive Breakpoints

- **Mobile (< 768px):** Stacked inputs, no swap button, 90% width
- **Tablet (768px - 1023px):** 600px widget, show swap button
- **Desktop (1024px+):** 700px widget, enhanced hover effects

---

## 🔗 Integration

### Search Flow
```typescript
const handleSearch = () => {
  const params = new URLSearchParams({
    origin_city: origin,
    destination_city: destination,
    departure_date: date.toISOString(),
    is_private: (bookingType === 'Private').toString(),
    passengers: passengers.toString()
  });
  
  router.push(`/trips?${params.toString()}`);
};
```

### Autocomplete API
```typescript
GET /api/locations/autocomplete?q=Alma

// Returns 40+ famous KZ/KG locations + Mapbox results
```

---

## ✅ Implementation Checklist

- [ ] Add hero image (`public/images/hero-bus-highway.jpg`)
- [ ] Create `SearchWidget.tsx` component
- [ ] Add `LocationInput.tsx` with autocomplete
- [ ] Integrate date picker (react-day-picker)
- [ ] Build passenger dropdown
- [ ] Add swap button with rotation animation
- [ ] Style search button (lime green #A4D233)
- [ ] Test mobile responsive layout
- [ ] Connect location autocomplete API
- [ ] Add PostHog analytics events
- [ ] Test full search → redirect flow

---

## 📊 Success Metrics

Track in PostHog:
- `landing_search_started` (user begins filling form)
- `landing_search_completed` (user clicks Search)
- Target: >70% search completion rate
- Target: <30 seconds average time to search

---

## 📚 Full Documentation

See `landing-page-ui-spec.md` for:
- Complete component specifications
- Accessibility guidelines (WCAG 2.1 AA)
- Full code examples
- Performance optimization
- Testing checklist

---

**Priority:** HIGH (first user touchpoint)  
**Effort:** 2-3 weeks  
**Epic:** Epic A.1 (View Trip Urgency Status)

---

**Created:** November 5, 2025  
**Status:** ✅ READY FOR IMPLEMENTATION
