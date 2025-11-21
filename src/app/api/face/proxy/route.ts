// src/app/api/face/proxy/route.ts
// Proxy for Python Face Recognition Service

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import axios from 'axios';

// Proxy all requests to the Python face recognition service
export async function POST(request: NextRequest) {
  // Check if feature is enabled
  if (!config.FEATURE_FACE_RECOGNITION) {
    return NextResponse.json(
      { error: 'Face recognition feature is disabled' },
      { status: 404 }
    );
  }
  
  // Check if external APIs are enabled for the Python service
  if (!config.ENABLE_EXTERNAL_APIS) {
    return NextResponse.json(
      { error: 'External APIs are disabled. Enable ENABLE_EXTERNAL_APIS to use face recognition service.' },
      { status: 403 }
    );
  }
  
  try {
    // Get the request body
    const body = await request.json();
    
    // Forward request to Python service
    const response = await axios.post('http://localhost:5000/compute-embedding', body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    // Return the response from Python service
    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    console.error('Face service proxy error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Return the error response from Python service
        return NextResponse.json(
          { error: error.response.data?.error || 'Face service error' },
          { status: error.response.status }
        );
      } else if (error.request) {
        // Service is not reachable
        return NextResponse.json(
          { error: 'Face recognition service is not available' },
          { status: 503 }
        );
      }
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Failed to communicate with face recognition service' },
      { status: 500 }
    );
  }
}