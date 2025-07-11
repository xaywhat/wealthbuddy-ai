import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get user preferences, create default if not exists
    let { data: preferences, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create default preferences if none exist
      const defaultPreferences = {
        user_id: userId,
        notification_frequency: 'weekly',
        budget_alerts_enabled: true,
        goal_reminders_enabled: true,
        achievement_notifications: true,
        weekly_summary_email: true,
        privacy_level: 'standard',
        preferred_currency: 'DKK',
        timezone: 'Europe/Copenhagen',
        language: 'da-DK'
      };

      const { data: newPreferences, error: insertError } = await supabaseAdmin
        .from('user_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return NextResponse.json({ success: false, error: 'Failed to create preferences' }, { status: 500 });
      }

      preferences = newPreferences;
    } else if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences });

  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Update user preferences
    const { data: updatedPreferences, error } = await supabaseAdmin
      .from('user_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences: updatedPreferences });

  } catch (error) {
    console.error('Error in preferences PUT:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
