import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// GET /api/categories/rules - Get categorization rules for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const rules = await DatabaseService.getCategorizationRules(userId);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching categorization rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categorization rules' },
      { status: 500 }
    );
  }
}

// POST /api/categories/rules - Create a new categorization rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, keyword, category, ruleType = 'contains', priority = 0 } = body;

    if (!userId || !keyword || !category) {
      return NextResponse.json(
        { error: 'User ID, keyword, and category are required' },
        { status: 400 }
      );
    }

    const rule = await DatabaseService.createCategorizationRule(
      userId,
      keyword,
      category,
      ruleType,
      priority
    );

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating categorization rule:', error);
    return NextResponse.json(
      { error: 'Failed to create categorization rule' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/rules - Update a categorization rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    if (!ruleId || !updates) {
      return NextResponse.json(
        { error: 'Rule ID and updates are required' },
        { status: 400 }
      );
    }

    const rule = await DatabaseService.updateCategorizationRule(ruleId, updates);
    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating categorization rule:', error);
    return NextResponse.json(
      { error: 'Failed to update categorization rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/rules - Delete a categorization rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    await DatabaseService.deleteCategorizationRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting categorization rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete categorization rule' },
      { status: 500 }
    );
  }
}
