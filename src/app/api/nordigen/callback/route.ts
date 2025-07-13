import { NextRequest, NextResponse } from 'next/server';
import nordigenClient from '@/lib/nordigen';

export async function GET(request: NextRequest) {
  // Get the base URL for redirects - hardcode production URL, fallback to localhost for development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://wealthbuddy-ai.vercel.app'
    : process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to homepage with error
      return NextResponse.redirect(
        `${baseUrl}/?error=bank_connection_failed`
      );
    }

    if (!ref) {
      return NextResponse.redirect(
        `${baseUrl}/?error=missing_reference`
      );
    }

    try {
      // Find the requisition by reference
      // We need to get all requisitions and find the one with matching reference
      // For now, we'll pass the reference and handle the lookup in the accounts endpoint
      return NextResponse.redirect(
        `${baseUrl}/?ref=${ref}&status=connected`
      );
    } catch (lookupError) {
      console.error('Error looking up requisition:', lookupError);
      return NextResponse.redirect(
        `${baseUrl}/?error=requisition_lookup_failed`
      );
    }

  } catch (error) {
    console.error('Error in Nordigen callback:', error);
    return NextResponse.redirect(
      `${baseUrl}/?error=callback_failed`
    );
  }
}
