import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, recommendationId, action, reason, details } = await request.json();

    if (!userId || !recommendationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store the feedback
    const { data: feedback, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        recommendation_id: recommendationId,
        action,
        reason,
        details
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing feedback:', error);
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
    }

    // Handle different actions
    let notificationMessage = '';
    let notificationType = 'info';

    switch (action) {
      case 'try_it':
        notificationMessage = 'Great! Your new mission has been created. Good luck!';
        notificationType = 'mission';
        break;
      case 'already_done':
        notificationMessage = 'Awesome! We\'ll generate new insights for you.';
        notificationType = 'success';
        break;
      case 'cant_do':
        notificationMessage = 'Thanks for the feedback! We\'ll improve our recommendations.';
        notificationType = 'info';
        break;
    }

    // Create notification
    if (notificationMessage) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Feedback Received',
          message: notificationMessage,
          type: notificationType
        });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Error in user-feedback POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: feedback, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Analyze patterns for AI learning
    const patterns = {
      cantDoReasons: feedback
        .filter(f => f.action === 'cant_do')
        .reduce((acc: Record<string, number>, f) => {
          if (f.reason) {
            acc[f.reason] = (acc[f.reason] || 0) + 1;
          }
          return acc;
        }, {}),
      preferredActions: feedback.reduce((acc: Record<string, number>, f) => {
        acc[f.action] = (acc[f.action] || 0) + 1;
        return acc;
      }, {}),
      totalFeedback: feedback.length
    };

    return NextResponse.json({ 
      success: true, 
      feedback,
      patterns
    });
  } catch (error) {
    console.error('Error in user-feedback GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
