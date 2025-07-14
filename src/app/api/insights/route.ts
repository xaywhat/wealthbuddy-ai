import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';
import { analyzeSpendingHabits } from '@/lib/openai';

interface InsightData {
  id: string;
  type: string;
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: string;
  priority: string;
  category?: string;
  confidence: number;
  created_at: string;
}

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

    // Get user's transactions for AI analysis
    const transactions = await DatabaseService.getTransactions(userId, 100);
    
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        insights: [],
        count: 0,
        message: 'No transactions found for analysis'
      });
    }

    // Generate AI insights using OpenAI
    const aiAnalysis = await analyzeSpendingHabits(transactions);
    
    // Convert AI analysis to insight format
    const insights: InsightData[] = [];
    
    // Add insights from AI analysis
    if (aiAnalysis.insights) {
      aiAnalysis.insights.forEach((insight: any, index: number) => {
        insights.push({
          id: `ai-${index}`,
          type: insight.type || 'spending_pattern',
          title: insight.title,
          description: insight.description,
          potentialSavings: insight.potentialSavings || 0,
          timeframe: insight.timeframe || 'monthly',
          priority: insight.priority || 'medium',
          category: insight.category,
          confidence: 85,
          created_at: new Date().toISOString()
        });
      });
    }

    // Add recommendations as insights
    if (aiAnalysis.recommendations) {
      aiAnalysis.recommendations.forEach((rec: any, index: number) => {
        insights.push({
          id: `rec-${index}`,
          type: 'savings_opportunity',
          title: `Optimize ${rec.category}`,
          description: rec.suggestion,
          potentialSavings: rec.savingsEstimate || 0,
          timeframe: 'monthly',
          priority: rec.impact || 'medium',
          category: rec.category,
          confidence: 80,
          created_at: new Date().toISOString()
        });
      });
    }

    // Generate additional insights from stored database insights
    try {
      const dbInsights = await DatabaseService.generateFinancialInsights(userId);
      dbInsights.forEach((insight: any, index: number) => {
        insights.push({
          id: `db-${index}`,
          type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          potentialSavings: insight.potential_savings || 0,
          timeframe: 'monthly',
          priority: insight.priority,
          category: insight.category,
          confidence: Math.round(insight.confidence_score * 100),
          created_at: insight.created_at
        });
      });
    } catch (dbError) {
      console.warn('Could not generate database insights:', dbError);
    }

    // Sort insights by priority and potential savings
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return (b.potentialSavings || 0) - (a.potentialSavings || 0);
    });

    const limitedInsights = limit ? insights.slice(0, parseInt(limit)) : insights;

    return NextResponse.json({
      success: true,
      insights: limitedInsights,
      count: limitedInsights.length,
      totalSavingsPotential: insights.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0)
    });

  } catch (error) {
    console.error('Error getting AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to get AI insights' },
      { status: 500 }
    );
  }
}
