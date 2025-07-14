import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, supabaseAdmin } from '@/lib/supabase';

// GET /api/categories - Get available categories for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const categories = await DatabaseService.getAvailableCategories(userId);
    return NextResponse.json({ 
      success: true,
      categories 
    });
  } catch (error) {
    console.error('Error fetching available categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category or apply categorization rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, categoryName, categoryType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Handle different actions
    if (action === 'create') {
      // Create new category
      if (!categoryName || !categoryType) {
        return NextResponse.json({ 
          error: 'Category name and type are required' 
        }, { status: 400 });
      }

      // Check if category already exists
      const existingCategories = await DatabaseService.getAvailableCategories(userId);
      if (existingCategories.includes(categoryName)) {
        return NextResponse.json({ 
          error: 'Category already exists' 
        }, { status: 400 });
      }

      // Use the new DatabaseService method to create category
      const categoryData = await DatabaseService.createCategoryType(
        userId,
        categoryName,
        categoryType
      );

      return NextResponse.json({ 
        success: true, 
        category: categoryData,
        message: `Category "${categoryName}" created successfully`
      });

    } else if (action === 'apply-rules') {
      // Apply categorization rules to existing transactions
      const updatedCount = await DatabaseService.applyCategorizationRules(userId);
      
      return NextResponse.json({ 
        success: true, 
        updatedCount,
        message: `Applied rules to ${updatedCount} transactions`
      });

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "create" or "apply-rules"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in categories POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
