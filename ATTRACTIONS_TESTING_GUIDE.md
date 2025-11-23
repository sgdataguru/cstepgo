# Testing Guide - Attractions Database Update

## Overview
This guide helps you test the newly added 58 attractions across Kazakhstan, Kyrgyzstan, and Uzbekistan.

## Quick Start

### 1. Development Server
The server is running at: **http://localhost:3002**

### 2. Test Pages
- **Landing Page**: http://localhost:3002
- **Create Trip Page**: http://localhost:3002/trips/create
- **Browse Trips**: http://localhost:3002/trips

## Test Cases

### Test Case 1: Search for Uzbekistan Cities (NEW!)
1. Navigate to "Create Trip" page
2. Click on "From" or "To" location field
3. Type: **"Samarkand"**
4. **Expected Result**: 
   - Samarkand should appear in autocomplete
   - Should show "Uzbekistan" as country
   - Badge should indicate it's a CITY

### Test Case 2: Search for Almaty Attractions
1. Type: **"Kok Tobe"** or **"koktobe"**
2. **Expected Result**:
   - Kök Töbe Hill should appear
   - Shows "ATTRACTION • Kazakhstan"
   - Badge color: Emerald/Green

### Test Case 3: Search for Astana Landmarks
1. Type: **"Baiterek"** or **"bayterek"**
2. **Expected Result**:
   - Baiterek Tower appears
   - Shows "LANDMARK • Kazakhstan"
   - Badge color: Amber/Yellow

### Test Case 4: Search for Samarkand Historical Sites
1. Type: **"Registan"** or **"registon"**
2. **Expected Result**:
   - Registan Square appears
   - Shows "LANDMARK • Uzbekistan"
   - Famous badge should display

### Test Case 5: Empty Search (Popular Cities)
1. Click on location field
2. Don't type anything
3. **Expected Result**:
   - Should show "Popular Destinations" header
   - Should display major cities (Almaty, Astana, Bishkek, Samarkand, Tashkent, etc.)

### Test Case 6: Search with Alternative Names
Try these alternative search terms:
- **"Sailgokh"** → Broadway Street (Tashkent)
- **"Bukhari"** → Imam al-Bukhari Complex (Samarkand)
- **"Zelyony bazaar"** → Green Bazaar (Almaty)
- **"Hazrati Imam"** → Khast-Imam Complex (Tashkent)
- **"Borovoe"** → Burabay National Park

### Test Case 7: Location Type Badges
Verify color coding:
- **CITY** = Blue badge
- **AIRPORT** = Purple badge
- **LANDMARK** = Amber/Yellow badge
- **ATTRACTION** = Emerald/Green badge

### Test Case 8: Famous Badge
Verify these show "Famous" badge:
- Almaty
- Astana
- Samarkand
- Tashkent
- Baiterek Tower
- Registan Square

## Manual Testing Checklist

### UI/UX Tests
- [ ] Autocomplete dropdown appears correctly
- [ ] Suggestions load quickly (< 100ms)
- [ ] Selected location displays with coordinates
- [ ] Clear button (X) works
- [ ] Clicking outside closes dropdown
- [ ] Keyboard navigation works (arrow keys)

### Data Accuracy Tests
- [ ] Coordinates display correctly (4 decimal places)
- [ ] Country names are correct
- [ ] Location types are accurate
- [ ] Search terms work for alternative names

### Search Functionality Tests
- [ ] Partial matches work (e.g., "Alma" finds "Almaty")
- [ ] Case-insensitive search works
- [ ] Search terms work (e.g., "koktobe" finds "Kök Töbe Hill")
- [ ] No duplicates in results
- [ ] Results are sorted (Famous first, Cities first, then alphabetical)

### Regional Coverage Tests
#### Kazakhstan (40 locations)
- [ ] Almaty attractions (20) - Kök Töbe Hill, Green Bazaar, Medeu, etc.
- [ ] Astana attractions (11) - Baiterek, Hazrat Sultan Mosque, Khan Shatyr, etc.
- [ ] Aktau & Mangystau (9) - Caspian Sea Promenade, Bozzhyra Canyon, etc.

#### Kyrgyzstan (14 locations)
- [ ] Bishkek attractions (9) - Ala-Too Square, Osh Bazaar, etc.
- [ ] Ala Archa National Park
- [ ] Burana Tower

#### Uzbekistan (27 locations - NEW!)
- [ ] Samarkand attractions (10) - Registan, Shah-i-Zinda, Bibi-Khanym, etc.
- [ ] Tashkent attractions (10) - Chorsu Bazaar, Amir Timur Square, etc.

## Sample Search Queries

### Quick Tests
```
Search Query         | Expected Result
---------------------|----------------------------------
"Almaty"            | Almaty (City)
"Samarkand"         | Samarkand (City) - UZBEKISTAN
"Registan"          | Registan Square
"Baiterek"          | Baiterek Tower
"Kok Tobe"          | Kök Töbe Hill
"Chorsu"            | Chorsu Bazaar (Tashkent)
"Bozzhyra"          | Bosphorus Canyon (Bozzhyra)
"Shah"              | Shah-i-Zinda Necropolis
"Opera"             | Astana Opera House, Kyrgyz Opera
"Museum"            | Multiple results (State Museums)
```

## Browser Testing

### Supported Browsers
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

### Responsive Testing
Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x812)

## API Testing (Optional)

If you want to test the backend API directly:

```bash
# Test search endpoint (if available)
curl http://localhost:3002/api/locations/search?q=Samarkand

# Expected response should include Samarkand with Uzbekistan
```

## Performance Testing

### Load Time
- Initial page load: < 2 seconds
- Autocomplete suggestions: < 100ms
- Search results: < 50ms

### Memory
- Check browser DevTools > Performance
- No memory leaks on repeated searches

## Common Issues & Solutions

### Issue 1: "No locations found"
**Solution**: Check spelling, try alternative names (search terms)

### Issue 2: Dropdown doesn't appear
**Solution**: Click the input field, ensure JavaScript is enabled

### Issue 3: Wrong coordinates displayed
**Solution**: Verify in database file `/src/lib/locations/famous-locations.ts`

### Issue 4: Uzbekistan locations not showing
**Solution**: Clear browser cache, restart dev server

## Data Verification

### Verify Coordinates
Use Google Maps to verify:
1. Copy coordinates from selected location
2. Paste into Google Maps search
3. Verify it's the correct location

### Sample Verification
- **Registan Square**: 39.6547°N, 66.9750°E
- **Baiterek Tower**: 51.1286°N, 71.4306°E
- **Kök Töbe Hill**: 43.2304°N, 76.9569°E

## Screenshots to Take

Document these scenarios:
1. Empty search showing popular cities
2. Search results for "Samarkand"
3. Selected location display with coordinates
4. Multiple results for generic search ("Museum")
5. Alternative search term working ("koktobe")

## Reporting Issues

If you find issues, document:
1. **What you searched**: Exact query text
2. **Expected result**: What should happen
3. **Actual result**: What actually happened
4. **Browser**: Chrome/Firefox/Safari version
5. **Screenshot**: Visual evidence

## Success Criteria

✅ All 81 locations searchable
✅ Uzbekistan locations appear correctly
✅ Alternative search terms work
✅ UI displays properly on all screen sizes
✅ No TypeScript/console errors
✅ Performance is acceptable (< 100ms search)

## Next Steps After Testing

1. If issues found → Report to developer
2. If all works → Ready for production deployment
3. Document any user feedback
4. Consider adding more locations based on user requests

---

**Test Date**: November 12, 2025
**Version**: 2.0 (58 new attractions added)
**Tester**: _______________
**Status**: ⬜ Pass ⬜ Fail ⬜ Needs Review
