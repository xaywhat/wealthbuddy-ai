import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get user's member since date
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ success: false, error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get total transactions count
    const { count: totalTransactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('account_id', userId);

    // Get accounts count
    const { count: totalAccounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Get active budgets count
    const { count: activeBudgets, error: budgetsError } = await supabaseAdmin
      .from('budgets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get completed goals count
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('financial_goals')
      .select('current_amount, target_amount')
      .eq('user_id', userId)
      .eq('is_active', true);

    const completedGoals = goals?.filter(goal => goal.current_amount >= goal.target_amount).length || 0;

    // Get achievements count
    const { count: achievementsEarned, error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Calculate total points from achievements
    const { data: userAchievements, error: pointsError } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        achievements(points)
      `)
      .eq('user_id', userId);

    const totalPoints = userAchievements?.reduce((sum, ua: any) => sum + (ua.achievements?.points || 0), 0) || 0;

    // Get last sync date
    const { data: lastSyncLog, error: syncError } = await supabaseAdmin
      .from('sync_logs')
      .select('last_sync')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const stats = {
      totalTransactions: totalTransactions || 0,
      totalAccounts: totalAccounts || 0,
      activeBudgets: activeBudgets || 0,
      completedGoals,
      achievementsEarned: achievementsEarned || 0,
      totalPoints,
      memberSince: user.created_at,
      lastSync: lastSyncLog?.last_sync || null
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Error in profile stats GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
