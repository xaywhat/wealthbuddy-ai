import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nordigenClient from '@/lib/nordigen';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's accounts from database
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No bank accounts found. Please connect a bank account first.' },
        { status: 400 }
      );
    }

    let totalNewTransactions = 0;
    let totalAccountsUpdated = 0;
    const syncResults = [];

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`Syncing account: ${account.name} (${account.id})`);

        // Update account sync status to in_progress
        await supabase
          .from('accounts')
          .update({ 
            sync_status: 'in_progress',
            sync_error_message: null
          })
          .eq('id', account.id);

        // Create sync history record
        const { data: syncHistory, error: syncHistoryError } = await supabase
          .from('sync_history')
          .insert({
            user_id: userId,
            account_id: account.id,
            sync_type: 'incremental',
            sync_status: 'in_progress'
          })
          .select()
          .single();

        if (syncHistoryError) {
          console.error('Error creating sync history:', syncHistoryError);
        }

        // Get account details and balances from Nordigen
        const accountDetails = await nordigenClient.getAccountDetails(account.id);
        
        // Delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const balances = await nordigenClient.getAccountBalances(account.id);
        
        // Delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Determine date range for transactions
        let dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 90); // Default: last 90 days

        // If we have a last sync date, only fetch transactions since then
        if (account.last_sync_date) {
          const lastSyncDate = new Date(account.last_sync_date);
          // Go back 1 day from last sync to ensure we don't miss any transactions
          lastSyncDate.setDate(lastSyncDate.getDate() - 1);
          dateFrom = lastSyncDate;
        }

        console.log(`Fetching transactions from ${dateFrom.toISOString().split('T')[0]} for account ${account.id}`);

        // Get transactions from Nordigen
        const transactions = await nordigenClient.getAccountTransactions(
          account.id,
          dateFrom.toISOString().split('T')[0]
        );

        // Process transactions
        const processedTransactions = (transactions.transactions?.booked || []).map((t: any) => ({
          id: t.transactionId || t.internalTransactionId,
          account_id: account.id,
          date: t.bookingDate || t.valueDate,
          amount: parseFloat(t.transactionAmount.amount),
          currency: t.transactionAmount.currency,
          description: t.remittanceInformationUnstructured || 
                      t.creditorName || 
                      t.debtorName || 
                      'Transaction',
          creditor_name: t.creditorName,
          debtor_name: t.debtorName,
          merchant_category_code: t.merchantCategoryCode,
          proprietary_bank_transaction_code: t.proprietaryBankTransactionCode,
        }));

        // Store new transactions in database (upsert to avoid duplicates)
        let newTransactionsCount = 0;
        if (processedTransactions.length > 0) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .upsert(processedTransactions, { 
              onConflict: 'id',
              ignoreDuplicates: true 
            });

          if (transactionError) {
            console.error('Error storing transactions:', transactionError);
            throw transactionError;
          }

          // Count how many were actually new (this is an approximation)
          newTransactionsCount = processedTransactions.length;
        }

        // Update account with new balance and sync status
        const newBalance = parseFloat(balances.balances?.[0]?.balanceAmount?.amount || '0');
        await supabase
          .from('accounts')
          .update({
            balance: newBalance,
            balance_type: balances.balances?.[0]?.balanceType || 'closingBooked',
            last_sync_date: new Date().toISOString(),
            sync_status: 'success',
            sync_error_message: null
          })
          .eq('id', account.id);

        // Update sync history record
        if (syncHistory) {
          await supabase
            .from('sync_history')
            .update({
              transactions_fetched: processedTransactions.length,
              transactions_new: newTransactionsCount,
              sync_status: 'success',
              completed_at: new Date().toISOString()
            })
            .eq('id', syncHistory.id);
        }

        totalNewTransactions += newTransactionsCount;
        totalAccountsUpdated++;

        syncResults.push({
          accountId: account.id,
          accountName: account.name,
          transactionsFetched: processedTransactions.length,
          newTransactions: newTransactionsCount,
          newBalance: newBalance,
          status: 'success'
        });

        // Add delay between accounts to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (accountError) {
        console.error(`Error syncing account ${account.id}:`, accountError);
        
        // Update account sync status to error
        await supabase
          .from('accounts')
          .update({
            sync_status: 'error',
            sync_error_message: accountError instanceof Error ? accountError.message : 'Unknown error',
            last_sync_date: new Date().toISOString()
          })
          .eq('id', account.id);

        syncResults.push({
          accountId: account.id,
          accountName: account.name,
          status: 'error',
          error: accountError instanceof Error ? accountError.message : 'Unknown error'
        });

        // Continue with other accounts even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Updated ${totalAccountsUpdated} accounts with ${totalNewTransactions} new transactions.`,
      stats: {
        accountsUpdated: totalAccountsUpdated,
        totalAccounts: accounts.length,
        newTransactions: totalNewTransactions,
      },
      results: syncResults
    });

  } catch (error) {
    console.error('Sync endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}
