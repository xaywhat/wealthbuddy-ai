import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    if (!userId || !category) {
      return NextResponse.json(
        { error: 'User ID and category are required' },
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

    // Update all transactions with this category to be uncategorized
    const { data: updatedTransactions, error: updateError } = await supabase
      .from('transactions')
      .update({ 
        user_category: null,
        category_source: null 
      })
      .eq('user_category', category)
      .in('account_id', accountIds)
      .select('id');

    if (updateError) {
      console.error('Error updating transactions:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transactions' },
        { status: 500 }
      );
    }

    // Also delete any categorization rules for this category
    const { error: rulesError } = await supabase
      .from('categorization_rules')
      .delete()
      .eq('user_id', userId)
      .eq('category', category);

    if (rulesError) {
      console.error('Error deleting rules:', rulesError);
      // Don't fail the request if rules deletion fails
    }

    return NextResponse.json({
      success: true,
      updatedTransactions: updatedTransactions?.length || 0,
      message: `Category "${category}" deleted and ${updatedTransactions?.length || 0} transactions marked as uncategorized`
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
