import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');

  if (!origin) {
    return NextResponse.json(
      { error: 'Origin parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate the origin is a proper URL
    const url = new URL(origin);
    const manifestUrl = `${url.origin}/.well-known/farcaster.json`;

    const response = await fetch(manifestUrl, {
      headers: {
        'User-Agent': 'Mini-App-Debugger/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'Invalid origin URL provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch manifest' },
      { status: 500 }
    );
  }
}
