import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { transactionsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, CATEGORY_ICONS } from '@/constants';
import type { Transaction } from '@/types';

const TransactionsScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const data = await transactionsAPI.getTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestCategory = async (transactionId: string) => {
    try {
      const result = await transactionsAPI.suggestCategory(transactionId);
      if (result.suggested_category) {
        Alert.alert(
          'Category Suggestion',
          `Suggested category: ${result.suggested_category}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Apply', onPress: () => loadTransactions() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get category suggestion');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'No transaction data available'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
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
                      <View style={styles.aiTag}>
                        <Ionicons name="sparkles" size={12} color={COLORS.accentYellow} />
                        <Text style={styles.aiTagText}>AI</Text>
                      </View>
                    )}
                    
                    {transaction.category === 'Uncategorized' && (
                      <TouchableOpacity
                        style={styles.suggestButton}
                        onPress={() => handleSuggestCategory(transaction.id)}
                      >
                        <Ionicons name="bulb" size={12} color={COLORS.accentBlue} />
                        <Text style={styles.suggestButtonText}>Suggest</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>
                  
                  {transaction.account_name && (
                    <Text style={styles.accountName}>
                      {transaction.account_name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.amount < 0 ? COLORS.accentRed : COLORS.accentGreen }
                  ]}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                  
                  {transaction.confidence_score && (
                    <Text style={styles.confidenceScore}>
                      {Math.round(transaction.confidence_score * 100)}% confident
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
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
  header: {
    padding: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  transactionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    marginRight: SPACING.lg,
    marginTop: SPACING.xs,
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
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  transactionCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accentYellow}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  aiTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.accentYellow,
    marginLeft: 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accentBlue}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  suggestButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.accentBlue,
    marginLeft: 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  accountName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  confidenceScore: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
  },
});

export default TransactionsScreen;
