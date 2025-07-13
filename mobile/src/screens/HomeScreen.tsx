import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { financialAPI, transactionsAPI, insightsAPI, accountsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, CATEGORY_ICONS } from '@/constants';
import type { FinancialSummary, Transaction, AIInsight } from '@/types';

const HomeScreen = () => {
  const { user } = useAuth();
  const { getPeriodLabel, getDateRange } = useTimePeriod();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from bank auth)
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen focused, refreshing data...');
      loadData();
    }, [])
  );

  const loadData = async () => {
    if (!user) return;

    try {
      const { startDate, endDate } = getDateRange();
      
      // Load data in parallel
      const [accountsResult, summaryResult, transactionsResult, insightsResult] = await Promise.all([
        accountsAPI.getAccounts(user.id).catch(err => {
          console.error('Accounts API error:', err);
          return { success: false, accounts: [] };
        }),
        financialAPI.getSummary(user.id, undefined, startDate, endDate).catch(err => {
          console.error('Summary API error:', err);
          return { success: false, summary: null };
        }),
        transactionsAPI.getTransactions(user.id, 5).catch(err => {
          console.error('Transactions API error:', err);
          return { success: false, transactions: [] };
        }),
        insightsAPI.getInsights(user.id, 3).catch(err => {
          console.error('Insights API error:', err);
          return { success: false, insights: [] };
        }),
      ]);

      // Extract accounts data
      const accountsData = accountsResult?.success ? accountsResult.accounts : 
                          accountsResult?.accounts || accountsResult || [];
      const accountsArray = Array.isArray(accountsData) ? accountsData : [];
      setAccounts(accountsArray);
      setIsConnected(accountsArray.length > 0);

      // Extract summary data
      const summaryData = summaryResult?.success ? summaryResult.summary : 
                          summaryResult?.summary || summaryResult;
      if (summaryData && typeof summaryData === 'object') {
        setSummary(summaryData);
      }

      // Extract transactions data
      const transactionsData = transactionsResult?.success ? transactionsResult.transactions : 
                               transactionsResult?.transactions || transactionsResult || [];
      const transactionsArray = Array.isArray(transactionsData) ? transactionsData : [];
      setRecentTransactions(transactionsArray);

      // Extract insights data
      const insightsData = insightsResult?.success ? insightsResult.insights : 
                           insightsResult?.insights || insightsResult || [];
      const insightsArray = Array.isArray(insightsData) ? insightsData : [];
      setInsights(insightsArray);

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentBlue}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back, {user?.keyphrase}!</Text>
          <Text style={styles.periodText}>{getPeriodLabel()}</Text>
        </View>

        {/* Financial Summary Cards - Always show */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, styles.incomeItem]}>
                <Ionicons name="trending-up" size={24} color={COLORS.accentGreen} />
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.accentGreen }]}>
                  {formatCurrency(summary?.totalIncome || 0)}
                </Text>
              </View>
              <View style={[styles.summaryItem, styles.expenseItem]}>
                <Ionicons name="trending-down" size={24} color={COLORS.accentRed} />
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.accentRed }]}>
                  {formatCurrency(Math.abs(summary?.totalExpenses || 0))}
                </Text>
              </View>
            </View>
            <View style={styles.netAmountContainer}>
              <Text style={styles.netLabel}>Net Amount</Text>
              <Text style={[
                styles.netAmount,
                { color: (summary?.netAmount || 0) >= 0 ? COLORS.accentGreen : COLORS.accentRed }
              ]}>
                {formatCurrency(summary?.netAmount || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 AI Insights</Text>
            {insights.map((insight) => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Ionicons 
                    name="bulb" 
                    size={16} 
                    color={COLORS.accentYellow} 
                  />
                </View>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                {insight.savings_potential && (
                  <Text style={styles.savingsText}>
                    Potential savings: {formatCurrency(insight.savings_potential)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[transaction.category] || '💳'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                    {transaction.is_categorized_automatically && (
                      <Ionicons name="sparkles" size={12} color={COLORS.accentYellow} />
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount < 0 ? COLORS.accentRed : COLORS.accentGreen }
                ]}>
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  periodText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  summaryContainer: {
    paddingHorizontal: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: SPACING['2xl'],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  incomeItem: {
    borderRightWidth: 1,
    borderRightColor: COLORS.borderColor,
  },
  expenseItem: {
    marginLeft: SPACING.lg,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  netAmountContainer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  netLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  netAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  section: {
    paddingHorizontal: SPACING['2xl'],
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  insightCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentYellow,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  insightMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  savingsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accentGreen,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.sm,
  },
  transactionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: SPACING.lg,
  },
  categoryIcon: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['5xl'],
  },
  emptyStateIcon: {
    marginBottom: SPACING['2xl'],
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['3xl'],
  },
  connectButton: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING['2xl'],
  },
  connectButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  demoNoteText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});

export default HomeScreen;
