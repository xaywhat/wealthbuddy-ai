import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'this_month';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Calculate date range based on period if not provided
    let calculatedStartDate = startDate;
    let calculatedEndDate = endDate;

    if (!startDate || !endDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'this_week': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          calculatedStartDate = startOfWeek.toISOString().split('T')[0];
          calculatedEndDate = now.toISOString().split('T')[0];
          break;
        }
        case 'last_2_weeks': {
          const twoWeeksAgo = new Date(today);
          twoWeeksAgo.setDate(today.getDate() - 14);
          calculatedStartDate = twoWeeksAgo.toISOString().split('T')[0];
          calculatedEndDate = now.toISOString().split('T')[0];
          break;
        }
        case 'this_month': {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          calculatedStartDate = startOfMonth.toISOString().split('T')[0];
          calculatedEndDate = now.toISOString().split('T')[0];
          break;
        }
        case 'last_month': {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          calculatedStartDate = startOfLastMonth.toISOString().split('T')[0];
          calculatedEndDate = endOfLastMonth.toISOString().split('T')[0];
          break;
        }
        case 'last_3_months': {
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          calculatedStartDate = threeMonthsAgo.toISOString().split('T')[0];
          calculatedEndDate = now.toISOString().split('T')[0];
          break;
        }
        default: {
          // All time - no date filter
          calculatedStartDate = null;
          calculatedEndDate = null;
        }
      }
    }

    // Use the database function to get financial summary
    const { data: summaryData, error } = await supabase
      .rpc('get_financial_summary', {
        p_user_id: userId,
        p_start_date: calculatedStartDate,
        p_end_date: calculatedEndDate
      });

    if (error) {
      console.error('Error fetching financial summary:', error);
      return NextResponse.json({ error: 'Failed to fetch financial summary' }, { status: 500 });
    }

    const summary = summaryData?.[0] || {
      total_income: 0,
      total_expenses: 0,
      net_amount: 0,
      transaction_count: 0
    };

    // Also get category breakdown
    let categoryQuery = supabase
      .from('transactions')
      .select(`
        amount,
        category,
        user_category,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId);

    if (calculatedStartDate) {
      categoryQuery = categoryQuery.gte('date', calculatedStartDate);
    }
    if (calculatedEndDate) {
      categoryQuery = categoryQuery.lte('date', calculatedEndDate);
    }

    const { data: transactions, error: transError } = await categoryQuery;

    if (transError) {
      console.error('Error fetching transactions for breakdown:', transError);
      return NextResponse.json({ error: 'Failed to fetch transaction breakdown' }, { status: 500 });
    }

    // Get category types
    const { data: categoryTypes, error: typesError } = await supabase
      .from('category_types')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (typesError) {
      console.error('Error fetching category types:', typesError);
      return NextResponse.json({ error: 'Failed to fetch category types' }, { status: 500 });
    }

    // Create category type map
    const categoryTypeMap = new Map();
    categoryTypes?.filter(ct => ct.user_id === null).forEach(ct => {
      categoryTypeMap.set(ct.category_name, ct.category_type);
    });
    categoryTypes?.filter(ct => ct.user_id === userId).forEach(ct => {
      categoryTypeMap.set(ct.category_name, ct.category_type);
    });

    // Calculate category breakdown
    const categoryBreakdown: Record<string, {
      amount: number;
      count: number;
      type: 'income' | 'expense';
    }> = {};

    transactions?.forEach(transaction => {
      const category = transaction.user_category || transaction.category || 'Uncategorized';
      let categoryType = categoryTypeMap.get(category) || 'expense';
      
      // Special handling for Internal Transfer
      if (category === 'Internal Transfer') {
        categoryType = transaction.amount >= 0 ? 'income' : 'expense';
      }

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          amount: 0,
          count: 0,
          type: categoryType as 'income' | 'expense'
        };
      }

      categoryBreakdown[category].amount += Math.abs(transaction.amount);
      categoryBreakdown[category].count += 1;
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome: parseFloat(summary.total_income || '0'),
        totalExpenses: parseFloat(summary.total_expenses || '0'),
        netAmount: parseFloat(summary.net_amount || '0'),
        transactionCount: summary.transaction_count || 0
      },
      categoryBreakdown,
      period: {
        type: period,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate
      }
    });
  } catch (error) {
    console.error('Error in financial summary GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
