import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For now, return mock insights since we don't have actual AI processing
    const mockInsights = [
      {
        id: '1',
        type: 'savings_opportunity',
        title: 'Reduce Coffee Shop Spending',
        description: 'You spent 15% more on coffee shops this month compared to last month. Consider brewing coffee at home to save money.',
        potentialSavings: 320,
        timeframe: 'monthly',
        priority: 'medium',
        category: 'Dining',
        confidence: 85,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'spending_pattern',
        title: 'Weekend Spending Spike',
        description: 'Your spending increases by 40% on weekends. Most of this is entertainment and dining expenses.',
        timeframe: 'weekly',
        priority: 'low',
        category: 'Entertainment',
        confidence: 92,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'goal_recommendation',
        title: 'Emergency Fund Goal',
        description: 'Based on your monthly expenses, you should aim to save at least 15,000 DKK for an emergency fund.',
        potentialSavings: 15000,
        timeframe: 'yearly',
        priority: 'high',
        confidence: 95,
        created_at: new Date().toISOString()
      }
    ];

    const limitedInsights = limit ? mockInsights.slice(0, parseInt(limit)) : mockInsights;

    return NextResponse.json({
      success: true,
      insights: limitedInsights,
      count: limitedInsights.length
    });

  } catch (error) {
    console.error('Error getting AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to get AI insights' },
      { status: 500 }
    );
  }
}
