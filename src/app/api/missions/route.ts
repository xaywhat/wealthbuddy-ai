import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching missions:', error);
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, missions });
  } catch (error) {
    console.error('Error in missions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, targetAmount, timeframeDays, category } = await request.json();

    if (!userId || !title || !timeframeDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + timeframeDays);

    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        user_id: userId,
        title,
        description,
        target_amount: targetAmount,
        timeframe_days: timeframeDays,
        deadline: deadline.toISOString(),
        category,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mission:', error);
      return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
    }

    // Create a notification for the new mission
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'New Mission Created!',
        message: `You've started a new mission: ${title}`,
        type: 'mission'
      });

    return NextResponse.json({ success: true, mission });
  } catch (error) {
    console.error('Error in missions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { missionId, status, currentAmount } = await request.json();

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (currentAmount !== undefined) updateData.current_amount = currentAmount;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data: mission, error } = await supabase
      .from('missions')
      .update(updateData)
      .eq('id', missionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating mission:', error);
      return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
    }

    // Create notification for mission completion
    if (status === 'completed') {
      await supabase
        .from('notifications')
        .insert({
          user_id: mission.user_id,
          title: 'Mission Completed! 🎉',
          message: `Congratulations! You've completed: ${mission.title}`,
          type: 'achievement'
        });
    }

    return NextResponse.json({ success: true, mission });
  } catch (error) {
    console.error('Error in missions PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
