import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

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

    const goals = await DatabaseService.getFinancialGoals(userId);

    return NextResponse.json({
      success: true,
      goals
    });

  } catch (error) {
    console.error('Error getting financial goals:', error);
    return NextResponse.json(
      { error: 'Failed to get financial goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, goal } = await request.json();

    if (!userId || !goal) {
      return NextResponse.json(
        { error: 'User ID and goal data are required' },
        { status: 400 }
      );
    }

    // Validate goal data
    const { name, target_amount, target_date, goal_type, priority = 'medium' } = goal;

    if (!name || !target_amount || !target_date || !goal_type) {
      return NextResponse.json(
        { error: 'Goal name, target amount, target date, and goal type are required' },
        { status: 400 }
      );
    }

    if (target_amount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be positive' },
        { status: 400 }
      );
    }

    const newGoal = await DatabaseService.createFinancialGoal(userId, {
      name,
      description: goal.description || '',
      target_amount: parseFloat(target_amount),
      current_amount: 0,
      target_date,
      goal_type,
      priority,
      category: goal.category,
      auto_save_amount: goal.auto_save_amount ? parseFloat(goal.auto_save_amount) : undefined,
      auto_save_frequency: goal.auto_save_frequency,
      is_active: true
    });

    return NextResponse.json({
      success: true,
      goal: newGoal,
      message: `Goal "${name}" created successfully`
    });

  } catch (error) {
    console.error('Error creating financial goal:', error);
    return NextResponse.json(
      { error: 'Failed to create financial goal' },
      { status: 500 }
    );
  }
}
