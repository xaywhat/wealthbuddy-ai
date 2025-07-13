import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';
import { detectSpendingAnomalies } from '@/lib/openai';

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

    // Get recent transactions for anomaly detection
    const transactions = await DatabaseService.getTransactions(userId, 100);
    
    if (transactions.length < 5) {
      return NextResponse.json({
        success: true,
        anomalies: [],
        message: 'Not enough transaction data for anomaly detection'
      });
    }

    // Detect spending anomalies using AI
    const anomalies = await detectSpendingAnomalies(transactions, userId);

    return NextResponse.json({
      success: true,
      anomalies,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error detecting spending anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to detect spending anomalies' },
      { status: 500 }
    );
  }
}
