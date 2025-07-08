import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpendingHabits } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Transactions array is required' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          totalSpent: 0,
          categories: {},
          insights: [],
          recommendations: []
        }
      });
    }

    // Analyze spending habits using AI
    const analysis = await analyzeSpendingHabits(transactions);

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('Error analyzing spending habits:', error);
    return NextResponse.json(
      { error: 'Failed to analyze spending habits' },
      { status: 500 }
    );
  }
}
