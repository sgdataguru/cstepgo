// API Route: /api/navigation/route
// Get navigation route between two points

import { NextRequest, NextResponse } from 'next/server';
import {
  getDirectionsApiUrl,
  parseDirectionsResponse,
} from '@/lib/navigation/utils';
import type { NavigationPreferences } from '@/lib/navigation/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, waypoints, preferences } = body;
    
    // Validate required fields
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }
    
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }
    
    // Build 2GIS Directions API URL
    const apiUrl = getDirectionsApiUrl(
      origin,
      destination,
      waypoints,
      preferences as NavigationPreferences
    );
    
    // Fetch route from 2GIS Maps
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch directions from 2GIS Maps');
    }
    
    const data = await response.json();
    
    if (!data.result || data.result.length === 0) {
      return NextResponse.json(
        { error: 'No routes found', details: data.error_message || 'No routes available' },
        { status: 400 }
      );
    }
    
    // Parse the response
    const route = parseDirectionsResponse(data);
    
    if (!route) {
      return NextResponse.json(
        { error: 'Failed to parse route data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      route,
      alternatives: data.result.length > 1 
        ? data.result.slice(1).map((r: any) => parseDirectionsResponse({ result: [r] })).filter((r: any) => r !== null)
        : [],
    });
    
  } catch (error) {
    console.error('Navigation route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate route',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
