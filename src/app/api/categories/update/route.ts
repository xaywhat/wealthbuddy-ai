import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// POST /api/categories/update - Update transaction category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, userId, newCategory, updateReason = 'manual' } = body;

    if (!transactionId || !userId || !newCategory) {
      return NextResponse.json(
        { error: 'Transaction ID, user ID, and new category are required' },
        { status: 400 }
      );
    }

    await DatabaseService.updateTransactionCategory(
      transactionId,
      userId,
      newCategory,
      updateReason
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction category:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction category' },
      { status: 500 }
    );
  }
}

// POST /api/categories/update/bulk - Bulk update transaction categories
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionIds, userId, newCategory } = body;

    if (!transactionIds || !Array.isArray(transactionIds) || !userId || !newCategory) {
      return NextResponse.json(
        { error: 'Transaction IDs array, user ID, and new category are required' },
        { status: 400 }
      );
    }

    await DatabaseService.bulkUpdateTransactionCategories(
      transactionIds,
      userId,
      newCategory
    );

    return NextResponse.json({ 
      success: true, 
      updatedCount: transactionIds.length 
    });
  } catch (error) {
    console.error('Error bulk updating transaction categories:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update transaction categories' },
      { status: 500 }
    );
  }
}
