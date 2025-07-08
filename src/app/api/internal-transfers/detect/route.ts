import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// POST /api/internal-transfers/detect - Detect and categorize internal transfers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updatedCount = await DatabaseService.detectInternalTransfers(userId);
    
    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Detected and categorized ${updatedCount} internal transfer transactions`
    });
  } catch (error) {
    console.error('Error detecting internal transfers:', error);
    return NextResponse.json(
      { error: 'Failed to detect internal transfers' },
      { status: 500 }
    );
  }
}
