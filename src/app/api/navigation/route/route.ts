// API Route: /api/navigation/route
// Get navigation route between two points

import { NextRequest, NextResponse } from 'next/server';
import {
  getDirectionsApiRequest,
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
    
    // Check if 2GIS API key is configured (and not a placeholder)
    const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
    if (!apiKey || apiKey === 'demo' || apiKey === 'your-api-key-here') {
      // Return a calculated route if no real API key
      const distance = Math.round(
        Math.sqrt(
          Math.pow((destination.lat - origin.lat) * 111, 2) +
          Math.pow((destination.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180), 2)
        ) * 1000
      ); // Approximate distance in meters
      
      const duration = Math.round(distance / 15); // Assume 15 m/s average speed
      
      return NextResponse.json({
        success: true,
        route: {
          distance,
          duration,
          steps: [
            {
              distance,
              duration,
              instruction: `Drive from origin to destination (${(distance/1000).toFixed(1)} km)`,
              maneuver: 'straight',
              startLocation: { lat: origin.lat, lng: origin.lng },
              endLocation: { lat: destination.lat, lng: destination.lng },
            }
          ],
          polyline: `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
          bounds: {
            northeast: { lat: Math.max(origin.lat, destination.lat), lng: Math.max(origin.lng, destination.lng) },
            southwest: { lat: Math.min(origin.lat, destination.lat), lng: Math.min(origin.lng, destination.lng) },
          },
        },
        alternatives: [],
        note: 'Estimated route (2GIS API key not configured)',
      });
    }
    
    // Build 2GIS Directions API request (POST)
    const { url: apiUrl, body: apiBody } = getDirectionsApiRequest(
      origin,
      destination,
      waypoints,
      preferences as NavigationPreferences
    );
    
    // Fetch route from 2GIS Maps with 3 second timeout for fast fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    let response: Response;
    try {
      response = await fetch(apiUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Timeout or network error - use fallback immediately
      console.warn('2GIS API timeout/error, using fast fallback:', fetchError.name);
      const distance = Math.round(
        Math.sqrt(
          Math.pow((destination.lat - origin.lat) * 111, 2) +
          Math.pow((destination.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180), 2)
        ) * 1000
      );
      const duration = Math.round(distance / 15);
      
      return NextResponse.json({
        success: true,
        route: {
          distance,
          duration,
          steps: [{
            distance,
            duration,
            instruction: `Drive to destination (${(distance/1000).toFixed(1)} km)`,
            maneuver: 'straight',
            startLocation: origin,
            endLocation: destination,
          }],
          polyline: `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
          bounds: {
            northeast: { lat: Math.max(origin.lat, destination.lat), lng: Math.max(origin.lng, destination.lng) },
            southwest: { lat: Math.min(origin.lat, destination.lat), lng: Math.min(origin.lng, destination.lng) },
          },
        },
        alternatives: [],
        note: 'Estimated route (API timeout)',
      });
    }
    
    if (!response.ok) {
      // Return fallback route on API error
      console.warn('2GIS API request failed, using fallback calculation');
      const distance = Math.round(
        Math.sqrt(
          Math.pow((destination.lat - origin.lat) * 111, 2) +
          Math.pow((destination.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180), 2)
        ) * 1000
      );
      const duration = Math.round(distance / 15);
      
      return NextResponse.json({
        success: true,
        route: {
          distance,
          duration,
          steps: [{
            distance,
            duration,
            instruction: `Drive to destination (${(distance/1000).toFixed(1)} km)`,
            maneuver: 'straight',
            startLocation: origin,
            endLocation: destination,
          }],
          polyline: `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
          bounds: {
            northeast: { lat: Math.max(origin.lat, destination.lat), lng: Math.max(origin.lng, destination.lng) },
            southwest: { lat: Math.min(origin.lat, destination.lat), lng: Math.min(origin.lng, destination.lng) },
          },
        },
        alternatives: [],
        note: 'Estimated route (API unavailable)',
      });
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
