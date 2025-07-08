import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, userId } = await request.json();

    if (!transactionId || !userId) {
      return NextResponse.json(
        { error: 'Transaction ID and User ID are required' },
        { status: 400 }
      );
    }

    // First get the account IDs for this user
    const { data: userAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('Error fetching user accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch user accounts' },
        { status: 500 }
      );
    }

    const accountIds = userAccounts?.map(acc => acc.id) || [];

    // Update the transaction to remove its category
    const { error } = await supabase
      .from('transactions')
      .update({ 
        user_category: null,
        category_source: null 
      })
      .eq('id', transactionId)
      .in('account_id', accountIds);

    if (error) {
      console.error('Error removing transaction category:', error);
      return NextResponse.json(
        { error: 'Failed to remove transaction category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction category removed successfully'
    });

  } catch (error) {
    console.error('Error removing transaction category:', error);
    return NextResponse.json(
      { error: 'Failed to remove transaction category' },
      { status: 500 }
    );
  }
}
