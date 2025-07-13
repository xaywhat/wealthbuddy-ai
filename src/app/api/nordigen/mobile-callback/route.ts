import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    const error = searchParams.get('error');

    // If there's an error, redirect to mobile app with error
    if (error) {
      return NextResponse.redirect(`wealthbuddy://callback?error=${encodeURIComponent(error)}`);
    }

    // If successful, redirect to mobile app with success and reference
    const redirectUrl = `wealthbuddy://callback?success=true${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Mobile callback error:', error);
    return NextResponse.redirect(`wealthbuddy://callback?error=${encodeURIComponent('Authentication failed')}`);
  }
}
