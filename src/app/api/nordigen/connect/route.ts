import { NextRequest, NextResponse } from 'next/server';
import nordigenClient, { DANISH_BANKS, BankId } from '@/lib/nordigen';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { bankId, userId } = await request.json();

    if (!bankId || !DANISH_BANKS[bankId as BankId]) {
      return NextResponse.json(
        { error: 'Invalid bank ID' },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!process.env.NORDIGEN_SECRET_ID || !process.env.NORDIGEN_SECRET_KEY) {
      console.error('Missing Nordigen API credentials');
      return NextResponse.json(
        { error: 'Nordigen API credentials not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    // Get the base URL for callbacks - hardcode production URL, fallback to localhost for development
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wealthbuddy-ai.vercel.app'
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (!baseUrl) {
      console.error('Missing base URL configuration');
      return NextResponse.json(
        { error: 'Base URL not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    const institutionId = DANISH_BANKS[bankId as BankId];
    const redirectUrl = `${baseUrl}/api/nordigen/callback`;
    const reference = `wealthbuddy-${Date.now()}`;

    console.log('Creating requisition with:', {
      institutionId,
      redirectUrl,
      reference,
      hasSecretId: !!process.env.NORDIGEN_SECRET_ID,
      hasSecretKey: !!process.env.NORDIGEN_SECRET_KEY,
    });

    // Create requisition
    const requisition = await nordigenClient.createRequisition(
      institutionId,
      redirectUrl,
      reference
    );

    // Save bank connection to database if userId is provided
    if (userId) {
      try {
        await DatabaseService.saveBankConnection(
          userId,
          requisition.id,
          institutionId,
          requisition.status || 'CR' // Created status
        );
        console.log('Bank connection saved to database');
      } catch (dbError) {
        console.error('Failed to save bank connection to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      requisitionId: requisition.id,
      authUrl: requisition.link,
      reference: requisition.reference,
    });

  } catch (error: any) {
    console.error('Error creating bank connection:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create bank connection';
    
    if (error.response?.status === 401) {
      errorMessage = 'Invalid Nordigen API credentials. Please check your NORDIGEN_SECRET_ID and NORDIGEN_SECRET_KEY.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request to Nordigen API. Please check your configuration.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Unable to connect to Nordigen API. Please check your internet connection.';
    } else if (error.response?.data?.detail) {
      errorMessage = `Nordigen API error: ${error.response.data.detail}`;
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
