import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: groups, error } = await supabase
      .from('category_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching category groups:', error);
      return NextResponse.json({ error: 'Failed to fetch category groups' }, { status: 500 });
    }

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error('Error in category-groups GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, categories, groupType = 'expense', isDefault = false } = await request.json();

    if (!userId || !name || !categories || categories.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If this is being set as default, unset other defaults of the same type
    if (isDefault) {
      await supabase
        .from('category_groups')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('group_type', groupType);
    }

    const { data: group, error } = await supabase
      .from('category_groups')
      .insert({
        user_id: userId,
        name,
        categories,
        group_type: groupType,
        is_default: isDefault
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category group:', error);
      return NextResponse.json({ error: 'Failed to create category group' }, { status: 500 });
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error in category-groups POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { groupId, name, categories, groupType, isDefault } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get the group to find the user_id
    const { data: existingGroup } = await supabase
      .from('category_groups')
      .select('user_id, group_type')
      .eq('id', groupId)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // If this is being set as default, unset other defaults of the same type
    if (isDefault) {
      await supabase
        .from('category_groups')
        .update({ is_default: false })
        .eq('user_id', existingGroup.user_id)
        .eq('group_type', groupType || existingGroup.group_type);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (categories) updateData.categories = categories;
    if (groupType) updateData.group_type = groupType;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    const { data: group, error } = await supabase
      .from('category_groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category group:', error);
      return NextResponse.json({ error: 'Failed to update category group' }, { status: 500 });
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error in category-groups PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('category_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Error deleting category group:', error);
      return NextResponse.json({ error: 'Failed to delete category group' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Category group deleted successfully' });
  } catch (error) {
    console.error('Error in category-groups DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
