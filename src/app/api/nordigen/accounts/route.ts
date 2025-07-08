import { NextRequest, NextResponse } from 'next/server';
import nordigenClient from '@/lib/nordigen';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, userId } = await request.json();

    if (!requisitionId || !userId) {
      return NextResponse.json(
        { error: 'Requisition ID and User ID are required' },
        { status: 400 }
      );
    }

    let requisition;
    
    // Check if requisitionId is actually a reference (starts with 'wealthbuddy-')
    if (requisitionId.startsWith('wealthbuddy-')) {
      console.log('Looking up requisition by reference:', requisitionId);
      // Find requisition by reference
      requisition = await nordigenClient.findRequisitionByReference(requisitionId);
    } else {
      // Get requisition details directly by ID
      requisition = await nordigenClient.getRequisition(requisitionId);
    }

    if (requisition.status !== 'LN') {
      return NextResponse.json(
        { error: 'Bank connection not yet completed', status: requisition.status },
        { status: 400 }
      );
    }

    const accounts = [];
    const allTransactions = [];
    let totalTransactionsStored = 0;

    // Fetch data for each account with delays to prevent rate limiting
    for (let i = 0; i < requisition.accounts.length; i++) {
      const accountId = requisition.accounts[i];
      try {
        console.log(`Fetching data for account ${i + 1}/${requisition.accounts.length}: ${accountId}`);
        
        // Add delay between accounts to prevent rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between accounts
        }
        
        // Get account details
        const accountDetails = await nordigenClient.getAccountDetails(accountId);
        
        // Longer delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        
        // Get account balances
        const balances = await nordigenClient.getAccountBalances(accountId);
        
        // Longer delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        
        // Get transactions (last 90 days)
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 90);
        const transactions = await nordigenClient.getAccountTransactions(
          accountId,
          dateFrom.toISOString().split('T')[0]
        );

        // Process account data
        const account = {
          nordigen_account_id: accountId,
          user_id: userId,
          name: accountDetails.account?.name || accountDetails.account?.product || 'Account',
          iban: accountDetails.account?.iban,
          currency: accountDetails.account?.currency || 'DKK',
          balance: parseFloat(balances.balances?.[0]?.balanceAmount?.amount || '0'),
          balance_type: balances.balances?.[0]?.balanceType || 'closingBooked',
          requisition_id: requisition.id,
          last_sync_date: new Date().toISOString(),
          sync_status: 'success'
        };

        // Store account in database (upsert) and get the database ID
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .upsert(account, { 
            onConflict: 'nordigen_account_id',
            ignoreDuplicates: false 
          })
          .select('id')
          .single();

        if (accountError) {
          console.error('Error storing account:', accountError);
          throw accountError;
        }

        // Get the database-generated account ID
        const databaseAccountId = accountData.id;
        
        accounts.push({ ...account, id: databaseAccountId });

        // Process transactions
        const processedTransactions = (transactions.transactions?.booked || []).map((t: any) => ({
          nordigen_transaction_id: t.transactionId || t.internalTransactionId,
          account_id: databaseAccountId, // Use database ID, not Nordigen ID
          date: t.bookingDate || t.valueDate,
          amount: parseFloat(t.transactionAmount.amount),
          currency: t.transactionAmount.currency,
          description: t.remittanceInformationUnstructured || 
                      t.creditorName || 
                      t.debtorName || 
                      'Transaction',
          creditor_name: t.creditorName,
          debtor_name: t.debtorName,
        }));

        // Store transactions in database (upsert to avoid duplicates)
        if (processedTransactions.length > 0) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .upsert(processedTransactions, { 
              onConflict: 'nordigen_transaction_id',
              ignoreDuplicates: true 
            });

          if (transactionError) {
            console.error('Error storing transactions:', transactionError);
            throw transactionError;
          }

          totalTransactionsStored += processedTransactions.length;
        }

        allTransactions.push(...processedTransactions);

      } catch (accountError) {
        console.error(`Error fetching data for account ${accountId}:`, accountError);
        
        // Update account sync status to error
        await supabase
          .from('accounts')
          .upsert({
            nordigen_account_id: accountId,
            user_id: userId,
            sync_status: 'error',
            sync_error_message: accountError instanceof Error ? accountError.message : 'Unknown error',
            last_sync_date: new Date().toISOString()
          }, { 
            onConflict: 'nordigen_account_id',
            ignoreDuplicates: false 
          });
        
        // Continue with other accounts even if one fails
      }
    }

    // Create sync history records for each account
    for (const account of accounts) {
      const { error: syncHistoryError } = await supabase
        .from('sync_history')
        .insert({
          user_id: userId,
          account_id: account.id, // Use the database account ID
          sync_type: 'initial',
          transactions_fetched: allTransactions.filter(t => t.account_id === account.id).length,
          transactions_new: allTransactions.filter(t => t.account_id === account.id).length,
          sync_status: 'success',
          completed_at: new Date().toISOString()
        });

      if (syncHistoryError) {
        console.error('Error creating sync history for account:', account.id, syncHistoryError);
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      accounts,
      transactions: allTransactions,
      requisitionStatus: requisition.status,
      totalTransactionsStored,
      message: `Successfully stored ${accounts.length} accounts and ${totalTransactionsStored} transactions`
    });

  } catch (error) {
    console.error('Error fetching and storing account data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch and store account data' },
      { status: 500 }
    );
  }
}
