import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Run advanced internal transfer detection
    const detectedTransfers = await DatabaseService.detectInternalTransfersAdvanced(userId);

    return NextResponse.json({
      success: true,
      transfers: detectedTransfers,
      count: detectedTransfers.length,
      message: `Detected ${detectedTransfers.length} internal transfers`
    });

  } catch (error) {
    console.error('Error detecting internal transfers:', error);
    return NextResponse.json(
      { error: 'Failed to detect internal transfers' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get existing internal transfers
    const { data, error } = await supabaseAdmin
      .from('internal_transfers')
      .select(`
        *,
        from_transaction:transactions!from_transaction_id(*),
        to_transaction:transactions!to_transaction_id(*)
      `)
      .eq('user_id', userId)
      .order('transfer_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get internal transfers: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      transfers: data || []
    });

  } catch (error) {
    console.error('Error getting internal transfers:', error);
    return NextResponse.json(
      { error: 'Failed to get internal transfers' },
      { status: 500 }
    );
  }
}
