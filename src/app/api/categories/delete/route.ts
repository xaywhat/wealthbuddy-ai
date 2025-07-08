import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

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

    // Get all transactions for this user with this category
    const transactions = await DatabaseService.getTransactions(userId);
    const transactionsToUpdate = transactions.filter(tx => 
      DatabaseService.getEffectiveCategory(tx) === category
    );

    // Update each transaction to remove the category
    let updatedCount = 0;
    for (const transaction of transactionsToUpdate) {
      try {
        await DatabaseService.updateTransactionCategory(
          transaction.id,
          userId,
          'Uncategorized',
          'manual'
        );
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update transaction ${transaction.id}:`, error);
      }
    }

    // Also delete any categorization rules for this category
    try {
      const rules = await DatabaseService.getCategorizationRules(userId);
      const rulesToDelete = rules.filter(rule => rule.category === category);
      
      for (const rule of rulesToDelete) {
        await DatabaseService.deleteCategorizationRule(rule.id);
      }
    } catch (error) {
      console.error('Error deleting categorization rules:', error);
      // Don't fail the request if rules deletion fails
    }

    // Also delete any internal transfer rules for this category
    try {
      const transferRules = await DatabaseService.getInternalTransferRules(userId);
      const transferRulesToDelete = transferRules.filter(rule => rule.category === category);
      
      for (const rule of transferRulesToDelete) {
        await DatabaseService.deleteInternalTransferRule(rule.id);
      }
    } catch (error) {
      console.error('Error deleting internal transfer rules:', error);
      // Don't fail the request if transfer rules deletion fails
    }

    return NextResponse.json({
      success: true,
      updatedTransactions: updatedCount,
      message: `Category "${category}" deleted and ${updatedCount} transactions marked as uncategorized`
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
