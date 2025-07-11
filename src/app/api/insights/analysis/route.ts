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

    // For now, return mock analysis since we don't have actual AI processing
    const mockAnalysis = {
      categoryBreakdown: {
        'Groceries': { amount: 2850, percentage: 28.5, trend: -5.2 },
        'Transport': { amount: 1200, percentage: 12.0, trend: 15.8 },
        'Dining': { amount: 950, percentage: 9.5, trend: 22.1 },
        'Entertainment': { amount: 680, percentage: 6.8, trend: -8.3 },
        'Bills': { amount: 1450, percentage: 14.5, trend: 2.1 },
        'Shopping': { amount: 820, percentage: 8.2, trend: 35.7 },
        'Healthcare': { amount: 340, percentage: 3.4, trend: -12.5 }
      },
      monthlyTrend: 8.5,
      averageDailySpending: 275.50,
      topCategories: ['Groceries', 'Bills', 'Transport', 'Dining', 'Shopping'],
      unusualSpending: [
        {
          category: 'Shopping',
          amount: 820,
          reason: 'Spending is 35% higher than usual this month'
        },
        {
          category: 'Dining',
          amount: 950,
          reason: 'Increased restaurant visits compared to last month'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error('Error getting spending analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get spending analysis' },
      { status: 500 }
    );
  }
}
