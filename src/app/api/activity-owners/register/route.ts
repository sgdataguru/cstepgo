import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Log the registration data
        console.log('Registration attempt:', {
            businessName: body.businessName,
            email: body.email,
            phone: body.phone,
            timestamp: new Date().toISOString()
        });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock successful response
        return NextResponse.json({
            success: true,
            message: 'Registration submitted successfully! Please check your email for verification.',
            data: {
                id: 'mock-id-' + Date.now(),
                status: 'pending_verification'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Registration error:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Registration failed. Please try again.',
        }, { status: 500 });
    }
}
