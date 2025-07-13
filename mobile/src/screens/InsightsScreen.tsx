import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { insightsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants';
import type { AIInsight } from '@/types';

const InsightsScreen = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    if (!user) return;

    try {
      const data = await insightsAPI.getInsights(user.id);
      setInsights(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      await insightsAPI.generateInsights(user.id);
      await loadInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'bulb';
      case 'alert':
        return 'warning';
      case 'trend':
        return 'trending-up';
      case 'achievement':
        return 'trophy';
      default:
        return 'information-circle';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return COLORS.accentBlue;
      case 'alert':
        return COLORS.accentRed;
      case 'trend':
        return COLORS.accentGreen;
      case 'achievement':
        return COLORS.accentYellow;
      default:
        return COLORS.textSecondary;
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>AI Insights</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateNewInsights}
          disabled={isRefreshing}
        >
          <Ionicons 
            name={isRefreshing ? 'refresh' : 'sparkles'} 
            size={20} 
            color={COLORS.textPrimary} 
          />
          <Text style={styles.generateButtonText}>
            {isRefreshing ? 'Generating...' : 'Generate'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={generateNewInsights}
            tintColor={COLORS.accentBlue}
          />
        }
      >
        {insights.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bulb-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No insights yet</Text>
            <Text style={styles.emptySubtext}>
              Generate AI insights to get personalized financial advice
            </Text>
            <TouchableOpacity
              style={styles.generateEmptyButton}
              onPress={generateNewInsights}
              disabled={isRefreshing}
            >
              <Text style={styles.generateEmptyButtonText}>
                Generate Insights
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIconContainer}>
                  <Ionicons 
                    name={getInsightIcon(insight.type) as any}
                    size={24} 
                    color={getInsightColor(insight.type)} 
                  />
                </View>
                <View style={styles.insightHeaderText}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightType}>{insight.type}</Text>
                </View>
                {insight.savings_potential && (
                  <View style={styles.savingsContainer}>
                    <Text style={styles.savingsLabel}>Potential Savings</Text>
                    <Text style={styles.savingsAmount}>
                      {formatCurrency(insight.savings_potential)}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.insightMessage}>{insight.message}</Text>
              
              {insight.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{insight.category}</Text>
                </View>
              )}
              
              <Text style={styles.insightDate}>
                {new Date(insight.created_at).toLocaleDateString('da-DK')}
              </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  generateButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs,
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
    marginBottom: SPACING['2xl'],
  },
  generateEmptyButton: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  generateEmptyButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  insightCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  insightIconContainer: {
    marginRight: SPACING.lg,
    marginTop: SPACING.xs,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  insightType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  savingsContainer: {
    alignItems: 'flex-end',
  },
  savingsLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentGreen,
  },
  insightMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.accentBlue}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  categoryTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.accentBlue,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  insightDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
  },
});

export default InsightsScreen;
