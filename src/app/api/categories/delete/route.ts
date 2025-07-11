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

    // Check if it's a default category that shouldn't be deleted
    const defaultCategories = [
      'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
      'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Store',
      'Internal Transfer', 'Income', 'Uncategorized'
    ];

    if (defaultCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 400 }
      );
    }

    // Use the new DatabaseService method to delete the category
    const updatedCount = await DatabaseService.deleteCategory(userId, category);

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
