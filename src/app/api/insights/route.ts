import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, supabaseAdmin } from '@/lib/supabase';

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

    // Generate new insights
    const insights = await DatabaseService.generateFinancialInsights(userId);

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length
    });

  } catch (error) {
    console.error('Error getting financial insights:', error);
    return NextResponse.json(
      { error: 'Failed to get financial insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, insightId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'mark_read' && insightId) {
      // Mark insight as read
      const { error } = await supabaseAdmin
        .from('financial_insights')
        .update({ is_read: true })
        .eq('id', insightId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to mark insight as read: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Insight marked as read'
      });
    }

    if (action === 'mark_acted_upon' && insightId) {
      // Mark insight as acted upon
      const { error } = await supabaseAdmin
        .from('financial_insights')
        .update({ is_acted_upon: true })
        .eq('id', insightId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to mark insight as acted upon: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Insight marked as acted upon'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing insights:', error);
    return NextResponse.json(
      { error: 'Failed to process insights' },
      { status: 500 }
    );
  }
}
