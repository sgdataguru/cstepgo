# 2GIS Maps API Integration Guide

## Overview

StepperGO uses 2GIS Maps API for all mapping, geocoding, and navigation features. 2GIS provides superior coverage and data quality for Kazakhstan and Central Asia compared to other mapping providers.

## Why 2GIS?

- **Better Central Asia Coverage**: Comprehensive data for Kazakhstan, Kyrgyzstan, Uzbekistan, and other regional countries
- **Local Optimization**: UI/UX optimized for local users and address formats
- **Cost Effective**: Competitive pricing with generous free tier
- **Rich POI Data**: Detailed points of interest, business listings, and building information
- **Accurate Routing**: High-quality routing data for local road networks

## API Key Management

### Current API Key
```
NEXT_PUBLIC_2GIS_API_KEY=dbd7eb45-5a3c-49de-a539-af4213db3a92
```

### Rotating API Keys

For security and rate limiting purposes, API keys should be rotated periodically:

1. **Generate New Key**:
   - Visit https://dev.2gis.com/
   - Log in to your developer account
   - Navigate to "API Keys" section
   - Click "Create New Key"
   - Name your key (e.g., "StepperGO Production")
   - Copy the generated key

2. **Update Environment Variables**:
   ```bash
   # Update .env.local for development
   NEXT_PUBLIC_2GIS_API_KEY=your_new_api_key_here
   
   # Update production environment variables in your hosting platform
   # (Vercel, Railway, AWS, etc.)
   ```

3. **Test Integration**:
   ```bash
   npm run dev
   # Visit your app and test:
   # - Location autocomplete
   # - Map rendering
   # - Route calculation
   ```

4. **Deploy Changes**:
   ```bash
   git add .env.production
   git commit -m "Update 2GIS API key"
   git push
   ```

5. **Revoke Old Key** (after confirming new key works):
   - Return to https://dev.2gis.com/
   - Navigate to "API Keys"
   - Find the old key
   - Click "Revoke" or "Delete"

## Features Implemented

### 1. Location Autocomplete
- Component: `LocationAutocomplete`
- Hook: `use2GISPlaces`
- API: 2GIS Catalog API `/items` endpoint
- Supports: Kazakhstan, Kyrgyzstan, Uzbekistan, and other Central Asian countries

### 2. Geocoding & Reverse Geocoding
- Service: `TwoGISGeocoder`
- Features:
  - Text search for places
  - Place details by ID
  - Reverse geocoding (coordinates → address)

### 3. Maps & Visualization
- Components: `NavigationMap`, `LiveTrackingMap`
- Loader: `TwoGISLoader`
- Features:
  - Interactive maps
  - Custom markers
  - Popups and info windows
  - Bounds fitting

### 4. Directions & Routing
- Service: `TwoGISDirections`
- API: 2GIS Car Routing API
- Features:
  - Multi-point routing
  - Distance and duration calculation
  - Turn-by-turn instructions
  - Route geometry (polylines)

## API Endpoints Used

### Catalog API (Geocoding)
```
https://catalog.api.2gis.com/3.0/items
https://catalog.api.2gis.com/3.0/items/byid
https://catalog.api.2gis.com/3.0/items/geocode
```

### Car Routing API (Directions)
```
https://catalog.api.2gis.com/carrouting/6.0.0/global
```

### Maps SDK
```
https://maps.api.2gis.com/2.0/loader.js
```

## Rate Limits

2GIS API has the following rate limits (as of 2024):

- **Free Tier**: 25,000 requests/day
- **Basic Plan**: 100,000 requests/day
- **Pro Plan**: 500,000 requests/day
- **Enterprise**: Custom limits

Monitor usage at: https://dev.2gis.com/dashboard

## Error Handling

The integration includes comprehensive error handling:

```typescript
// User-friendly fallback when maps unavailable
if (mapError) {
  return <MapUnavailableMessage error={mapError} />;
}

// Graceful degradation for autocomplete
try {
  const suggestions = await geocoder.search(query);
} catch (error) {
  console.error('2GIS search error:', error);
  // Show cached results or error message
}
```

## Best Practices

1. **Cache Results**: Cache geocoding results to reduce API calls
2. **Debounce Searches**: Use 300ms debounce for autocomplete (already implemented)
3. **Error Boundaries**: Wrap map components in error boundaries
4. **Lazy Loading**: Load map SDK only when needed
5. **Monitor Usage**: Regularly check API usage dashboard

## Troubleshooting

### Maps Not Loading
- Check API key is set: `echo $NEXT_PUBLIC_2GIS_API_KEY`
- Verify key is valid at https://dev.2gis.com/
- Check browser console for CORS errors
- Ensure loader script URL is correct

### Autocomplete Not Working
- Verify API key has geocoding permissions
- Check network tab for API request/response
- Ensure country restrictions match your target region
- Test with known locations (e.g., "Almaty", "Astana")

### Route Calculation Fails
- Verify coordinates are in Central Asia region
- Check points are accessible by car
- Ensure routing API is enabled for your key
- Test with simple origin/destination first

## Migration from Google Maps

If migrating from Google Maps:

1. ✅ Update environment variables (`.env.example`)
2. ✅ Replace hooks (`useGooglePlaces` → `use2GISPlaces`)
3. ✅ Update components (map rendering logic)
4. ✅ Update API routes (directions endpoint)
5. ✅ Remove Google Maps dependencies
6. ✅ Update documentation
7. [ ] Test all map features thoroughly
8. [ ] Update any hardcoded Google Maps references in docs

## Support & Resources

- **2GIS Developer Portal**: https://dev.2gis.com/
- **API Documentation**: https://docs.2gis.com/en/api/
- **JavaScript API Reference**: https://docs.2gis.com/en/mapgl/sdk/overview
- **Support**: support@2gis.com
- **Community Forum**: https://community.2gis.ru/

## Related Files

- `src/lib/maps/2gis-adapter.ts` - Core 2GIS service classes
- `src/hooks/use2GISPlaces.ts` - React hook for places API
- `src/hooks/useAutocomplete.ts` - Autocomplete state management
- `src/components/LocationAutocomplete/index.tsx` - Autocomplete UI component
- `src/components/navigation/NavigationMap.tsx` - Navigation map component
- `src/components/tracking/LiveTrackingMap.tsx` - Live tracking map
- `src/lib/navigation/utils.ts` - Navigation utilities
- `src/app/api/navigation/route/route.ts` - Directions API endpoint
