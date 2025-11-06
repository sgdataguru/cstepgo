# Gate 1 Landing Page - Testing Checklist ✅

**Status**: Ready for Testing  
**Date**: November 5, 2025  
**Server**: Running at http://localhost:3000  

---

## ✅ Pre-Test Verification (COMPLETE)

- [x] All 9 files created successfully
- [x] No TypeScript compilation errors
- [x] No ESLint errors
- [x] Dependencies installed (date-fns, lucide-react)
- [x] Next.js dev server started successfully
- [x] No runtime errors in terminal

---

## 🧪 Manual Testing Checklist

### 1. Initial Load
- [ ] Navigate to `http://localhost:3000`
- [ ] Hero section loads without errors
- [ ] Heading displays: "Travel Smarter, Together"
- [ ] "Together" is in Gold color (#FFD700)
- [ ] Tagline displays: "Low cost travel across Central Asia"
- [ ] Search widget appears with frosted glass effect

**Expected Result**: Landing page displays with hero background (gradient fallback until image added)

---

### 2. Search Widget - Private/Share Toggle
- [ ] "Private Trip" is selected by default
- [ ] Click "Shared Trip"
- [ ] Radio button changes to Turquoise color
- [ ] Passenger count adjusts if > 4

**Test Case**: Select Private, set 10 passengers, switch to Shared → should auto-adjust to 4

---

### 3. Location Autocomplete - Origin
- [ ] Click in "From" input
- [ ] Type "Alma"
- [ ] Wait 300ms (debounce delay)
- [ ] Dropdown appears with suggestions:
  - Almaty (⭐ famous)
  - Almaty International Airport (⭐ famous)
- [ ] Click "Almaty Airport"
- [ ] Input fills with "Almaty International Airport"
- [ ] Dropdown closes

**Test Case**: Type "Bishe" → should show Bishkek options

---

### 4. Location Autocomplete - Destination
- [ ] Type "Charyn" in "To" input
- [ ] Dropdown shows "Charyn Canyon" (⭐ famous)
- [ ] Select "Charyn Canyon"
- [ ] Input fills correctly

**Test Case**: Type "Issyk" → should show "Issyk-Kul Lake"

---

### 5. Swap Button
- [ ] Set Origin: "Almaty"
- [ ] Set Destination: "Bishkek"
- [ ] Click swap button (circle with arrows)
- [ ] Origin now shows "Bishkek"
- [ ] Destination now shows "Almaty"
- [ ] Icon rotates 180° on hover

---

### 6. Date Picker
- [ ] Default date is today
- [ ] Display shows: "Today, 5 Nov" (or current date)
- [ ] Click right arrow (→)
- [ ] Date changes to tomorrow
- [ ] Display shows: "Tomorrow, 6 Nov"
- [ ] Click right arrow again
- [ ] Display shows: "Fri, 8 Nov" (or appropriate day)
- [ ] Click left arrow (←)
- [ ] Date goes back to tomorrow
- [ ] Cannot go before today (left arrow disables)

---

### 7. Passenger Selector
- [ ] Default is 1 passenger
- [ ] Display shows: "1 Adult"
- [ ] Open dropdown
- [ ] Shows options 1-13 (for Private)
- [ ] Select 5
- [ ] Display shows: "5 Adults" (plural)
- [ ] Switch to Shared Trip
- [ ] Dropdown now shows 1-4 only
- [ ] Current selection auto-adjusts if > 4

---

### 8. Form Validation
**Test Case 1: Empty Origin**
- [ ] Clear origin field
- [ ] Click "Search Trips" button
- [ ] Error appears: "Origin city is required"

**Test Case 2: Empty Destination**
- [ ] Fill origin: "Almaty"
- [ ] Clear destination
- [ ] Click "Search Trips"
- [ ] Error appears: "Destination city is required"

**Test Case 3: Duplicate Locations**
- [ ] Set origin: "Almaty"
- [ ] Set destination: "Almaty"
- [ ] Click "Search Trips"
- [ ] Error appears: "Origin and destination must be different"

**Test Case 4: Valid Form**
- [ ] Set origin: "Almaty Airport"
- [ ] Set destination: "Charyn Canyon"
- [ ] Click "Search Trips" (Gold button)
- [ ] No errors
- [ ] Redirects to `/trips` page

---

### 9. Search Redirect
- [ ] Fill form:
  - Type: Private
  - Origin: Almaty Airport
  - Destination: Charyn Canyon
  - Date: Tomorrow
  - Passengers: 3
- [ ] Click "Search Trips"
- [ ] URL changes to: `/trips?origin_city=Almaty%20International%20Airport&destination_city=Charyn%20Canyon&departure_date=2025-11-06&is_private=true&passengers=3`
- [ ] Trips page displays search summary

---

### 10. Features Section
- [ ] Scroll down past hero
- [ ] See 3 feature cards:
  - 💰 Real-time Pricing
  - ✅ Verified Drivers
  - 💬 Easy Communication
- [ ] Background gradient: Turquoise → Pink
- [ ] Hover over card → background lightens
- [ ] Click "Browse Trips" → navigates to `/trips`
- [ ] Click "Create Trip" → navigates to `/trips/create`

---

### 11. Popular Routes Section
- [ ] Scroll to "Popular Routes"
- [ ] See 6 route cards:
  1. Almaty → Charyn Canyon (~200 km, From ₸2,500)
  2. Almaty → Bishkek (~240 km, From ₸3,500)
  3. Bishkek → Issyk-Kul (~250 km, From ₸3,000)
  4. Almaty Airport → Almaty City (~25 km, From ₸800)
  5. Almaty → Medeu (~30 km, From ₸1,200)
  6. Bishkek → Osh (~680 km, From ₸8,500)
- [ ] Hover over card → scales up, shadow increases
- [ ] Click card → redirects to `/trips` with pre-filled params

---

### 12. Responsive Design

**Mobile (< 640px)**:
- [ ] Open DevTools
- [ ] Set viewport to iPhone SE (375px)
- [ ] Search widget is 90% width
- [ ] All inputs stack vertically
- [ ] Swap button is centered
- [ ] Buttons are full width
- [ ] Text is readable
- [ ] No horizontal scroll

**Tablet (640-1024px)**:
- [ ] Set viewport to iPad (768px)
- [ ] Search widget is 600px wide
- [ ] Layout is comfortable
- [ ] Feature cards are 3 columns
- [ ] Popular routes are 2 columns

**Desktop (> 1024px)**:
- [ ] Set viewport to 1920px
- [ ] Search widget is 700px wide
- [ ] Everything is centered
- [ ] Feature cards are 3 columns
- [ ] Popular routes are 3 columns
- [ ] Optimal spacing

---

### 13. Accessibility

**Keyboard Navigation**:
- [ ] Press Tab to navigate
- [ ] Focus visible (Turquoise ring)
- [ ] Tab order is logical:
  1. Private/Share radio
  2. Origin input
  3. Swap button
  4. Destination input
  5. Date picker
  6. Passenger dropdown
  7. Search button
- [ ] Press Enter on search button → submits

**Screen Reader**:
- [ ] Swap button has ARIA label: "Swap origin and destination cities"
- [ ] All inputs have associated labels
- [ ] Error messages are announced

**Focus States**:
- [ ] All interactive elements have visible focus
- [ ] Focus ring is Turquoise (#40E0D0)
- [ ] Ring is 2px wide

---

### 14. API Testing

**Autocomplete Endpoint**:
```bash
# Test 1: Valid query
curl "http://localhost:3000/api/locations/autocomplete?q=Alma"

# Expected: 200, { suggestions: [{ id: "almaty", name: "Almaty", ... }] }

# Test 2: Short query
curl "http://localhost:3000/api/locations/autocomplete?q=A"

# Expected: 400, { error: "Query must be at least 2 characters" }

# Test 3: No results
curl "http://localhost:3000/api/locations/autocomplete?q=XYZ123"

# Expected: 200, { suggestions: [] }
```

- [ ] Run Test 1 → returns Almaty results
- [ ] Run Test 2 → returns 400 error
- [ ] Run Test 3 → returns empty array

---

### 15. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Check**:
- [ ] Layout looks correct
- [ ] Animations work
- [ ] Autocomplete works
- [ ] Form validation works
- [ ] No console errors

---

### 16. Performance

**Lighthouse Audit** (Chrome DevTools):
- [ ] Open DevTools > Lighthouse
- [ ] Run audit for "Desktop"
- [ ] Check scores:
  - [ ] Performance > 90
  - [ ] Accessibility > 95
  - [ ] Best Practices > 90
  - [ ] SEO > 90

**Network Tab**:
- [ ] Check autocomplete requests
- [ ] Debounce working (only 1 request per 300ms)
- [ ] API response time < 200ms

---

### 17. PostHog Analytics (if configured)

- [ ] Open PostHog dashboard
- [ ] Fill search form
- [ ] Click "Search Trips"
- [ ] Check for event: `landing_search_started`
- [ ] Event properties include:
  - origin_city
  - destination_city
  - departure_date
  - is_private
  - passengers

**Note**: If PostHog not configured, this step will silently fail (no errors).

---

### 18. Error Handling

**Network Error**:
- [ ] Open DevTools > Network
- [ ] Set to "Offline"
- [ ] Type in location input
- [ ] Error message appears: "Failed to fetch locations..."
- [ ] Set back to "Online"
- [ ] Try again → works

**API Error**:
- [ ] Temporarily break API route (add syntax error)
- [ ] Restart server
- [ ] Type in location input
- [ ] Error message appears
- [ ] Fix API route
- [ ] Restart server
- [ ] Works again

---

### 19. Hero Image (After Adding)

**Once you add `/public/images/hero-car-highway.jpg`**:
- [ ] Refresh page
- [ ] Image loads in hero section
- [ ] Image is optimized by Next.js
- [ ] Blur placeholder shows first
- [ ] Image fades in smoothly
- [ ] Gradient overlay visible on top
- [ ] Text remains readable

---

### 20. Edge Cases

**Long Location Names**:
- [ ] Type: "Nursultan Nazarbayev International Airport"
- [ ] Input handles long text
- [ ] No overflow
- [ ] Text wraps or truncates gracefully

**Special Characters**:
- [ ] Type: "Issyk-Kul" (with hyphen)
- [ ] Autocomplete works
- [ ] No encoding issues

**Rapid Typing**:
- [ ] Type "Almaty" very fast
- [ ] Only 1 API call fires (debounce working)
- [ ] Results appear correctly

**Multiple Clicks**:
- [ ] Click swap button 10 times rapidly
- [ ] No errors
- [ ] State updates correctly

---

## 🐛 Bug Report Template

If you find any issues, use this template:

```markdown
**Bug**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Browser**: [Chrome 120, Firefox 121, etc.]

**Screenshot**: [If applicable]

**Console Errors**: [Copy from DevTools]
```

---

## ✅ Sign-Off

Once all tests pass:

- [ ] All checklist items completed
- [ ] No critical bugs found
- [ ] Performance meets standards
- [ ] Accessibility verified
- [ ] Responsive design confirmed
- [ ] API endpoints working
- [ ] Form validation working
- [ ] Analytics tracking (if configured)

**Tester**: _________________  
**Date**: _________________  
**Status**: ✅ PASSED / ❌ FAILED  

---

## 📞 Need Help?

**Documentation**:
- Implementation details: `GATE1_LANDING_PAGE_COMPLETE.md`
- Hero image guide: `public/images/README.md`
- Landing page specs: `docs/technical-description/landing-page-ui-spec.md`

**Common Issues**:
1. **Hero image not showing**: Check if file exists at `/public/images/hero-car-highway.jpg`
2. **Autocomplete not working**: Check if API route exists at `/api/locations/autocomplete/route.ts`
3. **PostHog not tracking**: Check if PostHog API key in `.env`
4. **Styling issues**: Clear browser cache, restart dev server

---

**Happy Testing! 🚀**
