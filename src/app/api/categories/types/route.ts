import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user-specific category types with fallback to defaults
    const { data: categoryTypes, error } = await supabase
      .from('category_types')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('is_default', { ascending: false })
      .order('category_name');

    if (error) {
      console.error('Error fetching category types:', error);
      return NextResponse.json({ error: 'Failed to fetch category types' }, { status: 500 });
    }

    // Process to ensure user-specific overrides take precedence
    const categoryTypeMap = new Map();
    
    // First add defaults
    categoryTypes?.filter(ct => ct.user_id === null).forEach(ct => {
      categoryTypeMap.set(ct.category_name, ct);
    });
    
    // Then override with user-specific
    categoryTypes?.filter(ct => ct.user_id === userId).forEach(ct => {
      categoryTypeMap.set(ct.category_name, ct);
    });

    const finalCategoryTypes = Array.from(categoryTypeMap.values());

    return NextResponse.json({ success: true, categoryTypes: finalCategoryTypes });
  } catch (error) {
    console.error('Error in category types GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, categoryName, categoryType } = await request.json();

    if (!userId || !categoryName || !categoryType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['income', 'expense'].includes(categoryType)) {
      return NextResponse.json({ error: 'Invalid category type' }, { status: 400 });
    }

    // Upsert user-specific category type
    const { data: categoryTypeRecord, error } = await supabase
      .from('category_types')
      .upsert({
        user_id: userId,
        category_name: categoryName,
        category_type: categoryType,
        is_default: false
      }, {
        onConflict: 'user_id,category_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating category type:', error);
      return NextResponse.json({ error: 'Failed to update category type' }, { status: 500 });
    }

    return NextResponse.json({ success: true, categoryType: categoryTypeRecord });
  } catch (error) {
    console.error('Error in category types POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const categoryName = searchParams.get('categoryName');

    if (!userId || !categoryName) {
      return NextResponse.json({ error: 'User ID and category name are required' }, { status: 400 });
    }

    // Delete user-specific category type (falls back to default)
    const { error } = await supabase
      .from('category_types')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', categoryName);

    if (error) {
      console.error('Error deleting category type:', error);
      return NextResponse.json({ error: 'Failed to delete category type' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Category type reset to default' });
  } catch (error) {
    console.error('Error in category types DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
