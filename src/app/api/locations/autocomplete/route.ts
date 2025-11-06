import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/locations/famous-locations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search famous locations
    const results = searchLocations(query, 8);

    // Format response
    const suggestions = results.map(location => ({
      id: location.id,
      name: location.name,
      type: location.type,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      isFamous: location.isFamous
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
