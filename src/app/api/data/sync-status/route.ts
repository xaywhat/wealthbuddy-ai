import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Get accounts with sync status
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, last_sync_date, sync_status, sync_error_message')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        status: 'no_accounts',
        needsSync: false,
        message: 'No bank accounts connected',
        accounts: []
      });
    }

    // Get latest sync history
    const { data: syncHistory, error: syncHistoryError } = await supabase
      .from('sync_history')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5);

    if (syncHistoryError) {
      console.error('Error fetching sync history:', syncHistoryError);
    }

    // Determine overall sync status
    const accountStatuses = accounts.map(account => account.sync_status);
    const hasNeverSynced = accountStatuses.includes('never');
    const hasInProgress = accountStatuses.includes('in_progress');
    const hasErrors = accountStatuses.includes('error');
    
    let overallStatus = 'success';
    if (hasInProgress) {
      overallStatus = 'in_progress';
    } else if (hasErrors) {
      overallStatus = 'error';
    } else if (hasNeverSynced) {
      overallStatus = 'never';
    }

    // Find the most recent sync date
    const lastSyncDates = accounts
      .filter(account => account.last_sync_date)
      .map(account => new Date(account.last_sync_date));
    
    const lastSyncDate = lastSyncDates.length > 0 
      ? new Date(Math.max(...lastSyncDates.map(date => date.getTime())))
      : null;

    // Determine if sync is needed (if last sync was more than 6 hours ago)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const needsSync = !lastSyncDate || lastSyncDate < sixHoursAgo || hasNeverSynced || hasErrors;

    return NextResponse.json({
      status: overallStatus,
      lastSync: lastSyncDate?.toISOString() || null,
      needsSync,
      accounts: accounts.map(account => ({
        id: account.id,
        name: account.name,
        lastSync: account.last_sync_date,
        status: account.sync_status,
        errorMessage: account.sync_error_message
      })),
      syncHistory: syncHistory || [],
      stats: {
        totalAccounts: accounts.length,
        successfulAccounts: accountStatuses.filter(s => s === 'success').length,
        errorAccounts: accountStatuses.filter(s => s === 'error').length,
        neverSyncedAccounts: accountStatuses.filter(s => s === 'never').length,
        inProgressAccounts: accountStatuses.filter(s => s === 'in_progress').length
      }
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
