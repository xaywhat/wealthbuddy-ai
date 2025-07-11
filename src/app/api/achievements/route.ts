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

    const userAchievements = await DatabaseService.getUserAchievements(userId);

    // Calculate total points
    const totalPoints = userAchievements.reduce((sum, ua: any) => {
      return sum + (ua.achievements?.points || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      achievements: userAchievements,
      totalPoints,
      count: userAchievements.length
    });

  } catch (error) {
    console.error('Error getting achievements:', error);
    return NextResponse.json(
      { error: 'Failed to get achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'check') {
      // Check and award new achievements
      const newAchievements = await DatabaseService.checkAndAwardAchievements(userId);

      return NextResponse.json({
        success: true,
        newAchievements,
        count: newAchievements.length,
        message: `Awarded ${newAchievements.length} new achievements`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing achievements:', error);
    return NextResponse.json(
      { error: 'Failed to process achievements' },
      { status: 500 }
    );
  }
}
