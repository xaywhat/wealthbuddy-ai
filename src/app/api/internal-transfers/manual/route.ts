import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// POST /api/internal-transfers/manual - Manually categorize a specific internal transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fromTransactionId, toTransactionId, category, description } = body;

    if (!userId || !fromTransactionId || !toTransactionId || !category) {
      return NextResponse.json(
        { error: 'User ID, from transaction ID, to transaction ID, and category are required' },
        { status: 400 }
      );
    }

    // Update both transactions with the manual category
    await DatabaseService.updateTransactionCategory(
      fromTransactionId,
      userId,
      category,
      'manual'
    );

    await DatabaseService.updateTransactionCategory(
      toTransactionId,
      userId,
      category,
      'manual'
    );

    return NextResponse.json({
      success: true,
      message: `Manual transfer categorized as "${category}"`
    });
  } catch (error) {
    console.error('Error manually categorizing transfer:', error);
    return NextResponse.json(
      { error: 'Failed to manually categorize transfer' },
      { status: 500 }
    );
  }
}

// GET /api/internal-transfers/manual - Get potential internal transfers for manual categorization
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

    // Get all transactions for the user
    const transactions = await DatabaseService.getTransactions(userId, 1000);
    
    // Find potential internal transfers (same amount, same date, different accounts)
    const potentialTransfers = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx1 = transactions[i];
      
      // Skip if already manually categorized
      if (tx1.user_category) continue;
      
      // Look for matching transaction (opposite amount, same date, different account)
      for (let j = i + 1; j < transactions.length; j++) {
        const tx2 = transactions[j];
        
        // Skip if already manually categorized
        if (tx2.user_category) continue;
        
        // Check if they could be a transfer pair
        if (
          tx1.date === tx2.date && // Same date
          tx1.account_id !== tx2.account_id && // Different accounts
          Math.abs(tx1.amount + tx2.amount) < 0.01 && // Amounts cancel out (allowing for small rounding differences)
          tx1.amount * tx2.amount < 0 // One positive, one negative
        ) {
          // Get account information
          const accounts = await DatabaseService.getAccounts(userId);
          const account1 = accounts.find(acc => acc.id === tx1.account_id);
          const account2 = accounts.find(acc => acc.id === tx2.account_id);
          
          potentialTransfers.push({
            id: `${tx1.id}-${tx2.id}`,
            fromTransaction: {
              ...tx1,
              accountName: account1?.name || 'Unknown Account'
            },
            toTransaction: {
              ...tx2,
              accountName: account2?.name || 'Unknown Account'
            },
            amount: Math.abs(tx1.amount),
            date: tx1.date,
            suggestedCategory: 'Internal Transfer'
          });
        }
      }
    }

    return NextResponse.json({
      potentialTransfers: potentialTransfers.slice(0, 50) // Limit to 50 for performance
    });
  } catch (error) {
    console.error('Error getting potential transfers:', error);
    return NextResponse.json(
      { error: 'Failed to get potential transfers' },
      { status: 500 }
    );
  }
}
