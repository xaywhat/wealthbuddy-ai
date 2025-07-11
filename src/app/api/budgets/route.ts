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

    const budgets = await DatabaseService.getBudgets(userId);
    
    // Also check for budget alerts
    const alerts = await DatabaseService.checkBudgetAlerts(userId);

    return NextResponse.json({
      success: true,
      budgets,
      alerts,
      alertsCount: alerts.length
    });

  } catch (error) {
    console.error('Error getting budgets:', error);
    return NextResponse.json(
      { error: 'Failed to get budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, budget } = await request.json();

    if (!userId || !budget) {
      return NextResponse.json(
        { error: 'User ID and budget data are required' },
        { status: 400 }
      );
    }

    // Validate budget data
    const { name, category, amount, period_type, alert_threshold = 0.8 } = budget;

    if (!name || !category || !amount || !period_type) {
      return NextResponse.json(
        { error: 'Budget name, category, amount, and period type are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Budget amount must be positive' },
        { status: 400 }
      );
    }

    const newBudget = await DatabaseService.createBudget(userId, {
      name,
      category,
      amount: parseFloat(amount),
      period_type,
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
      auto_adjust: false,
      alert_threshold: parseFloat(alert_threshold),
      created_by: 'user'
    });

    return NextResponse.json({
      success: true,
      budget: newBudget,
      message: `Budget "${name}" created successfully`
    });

  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { budgetId, updates } = await request.json();

    if (!budgetId || !updates) {
      return NextResponse.json(
        { error: 'Budget ID and updates are required' },
        { status: 400 }
      );
    }

    const updatedBudget = await DatabaseService.updateBudget(budgetId, updates);

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      message: 'Budget updated successfully'
    });

  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    await DatabaseService.deleteBudget(budgetId);

    return NextResponse.json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
