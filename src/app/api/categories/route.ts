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
    return NextResponse.json({ categories });
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

      // Add to category_types table
      const { data, error } = await supabaseAdmin
        .from('category_types')
        .insert({
          user_id: userId,
          category_name: categoryName,
          category_type: categoryType,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
          { error: 'Failed to create category' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        category: data,
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
