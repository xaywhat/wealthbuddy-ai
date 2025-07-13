import { NextRequest, NextResponse } from 'next/server';
import { suggestTransactionCategory } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { transaction } = await request.json();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction data is required' },
        { status: 400 }
      );
    }

    // Get AI suggestion for transaction category
    const suggestion = await suggestTransactionCategory(transaction);

    return NextResponse.json({
      success: true,
      suggestion
    });

  } catch (error) {
    console.error('Error suggesting transaction category:', error);
    return NextResponse.json(
      { error: 'Failed to suggest transaction category' },
      { status: 500 }
    );
  }
}
