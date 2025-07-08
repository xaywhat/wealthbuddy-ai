import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// GET /api/internal-transfers - Get internal transfer rules for a user
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

    const rules = await DatabaseService.getInternalTransferRules(userId);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching internal transfer rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch internal transfer rules' },
      { status: 500 }
    );
  }
}

// POST /api/internal-transfers - Create internal transfer rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fromAccountId, toAccountId, category, description } = body;

    if (!userId || !fromAccountId || !toAccountId || !category) {
      return NextResponse.json(
        { error: 'User ID, from account, to account, and category are required' },
        { status: 400 }
      );
    }

    const rule = await DatabaseService.createInternalTransferRule(
      userId,
      fromAccountId,
      toAccountId,
      category,
      description
    );

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating internal transfer rule:', error);
    return NextResponse.json(
      { error: 'Failed to create internal transfer rule' },
      { status: 500 }
    );
  }
}

// PUT /api/internal-transfers - Update internal transfer rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, category, description } = body;

    if (!ruleId || !category) {
      return NextResponse.json(
        { error: 'Rule ID and category are required' },
        { status: 400 }
      );
    }

    const rule = await DatabaseService.updateInternalTransferRule(ruleId, {
      category,
      description
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating internal transfer rule:', error);
    return NextResponse.json(
      { error: 'Failed to update internal transfer rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/internal-transfers - Delete internal transfer rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    await DatabaseService.deleteInternalTransferRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting internal transfer rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete internal transfer rule' },
      { status: 500 }
    );
  }
}
