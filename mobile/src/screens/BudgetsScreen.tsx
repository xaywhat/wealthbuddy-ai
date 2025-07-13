import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { budgetsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, BUDGET_PERIODS } from '@/constants';
import type { Budget } from '@/types';

const BudgetsScreen = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    amount: '',
    period_type: 'monthly',
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    if (!user) return;

    try {
      const data = await budgetsAPI.getBudgets(user.id);
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!user || !newBudget.name || !newBudget.category || !newBudget.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await budgetsAPI.createBudget(user.id, {
        ...newBudget,
        amount: parseFloat(newBudget.amount),
        alert_threshold: 80,
      });
      
      setModalVisible(false);
      setNewBudget({ name: '', category: '', amount: '', period_type: 'monthly' });
      loadBudgets();
    } catch (error) {
      Alert.alert('Error', 'Failed to create budget');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, amount: number) => {
    return Math.min((spent / amount) * 100, 100);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="target-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No budgets yet</Text>
            <Text style={styles.emptySubtext}>Create your first budget to start tracking your spending</Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const progress = getProgressPercentage(budget.spent, budget.amount);
            const isOverBudget = budget.spent > budget.amount;
            
            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Text style={styles.budgetPeriod}>{budget.period_type}</Text>
                </View>
                
                <Text style={styles.budgetCategory}>{budget.category}</Text>
                
                <View style={styles.budgetProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${progress}%`,
                          backgroundColor: isOverBudget ? COLORS.accentRed : COLORS.accentBlue
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>
                
                <View style={styles.budgetAmounts}>
                  <Text style={[
                    styles.spentAmount,
                    { color: isOverBudget ? COLORS.accentRed : COLORS.textPrimary }
                  ]}>
                    Spent: {formatCurrency(budget.spent)}
                  </Text>
                  <Text style={styles.totalAmount}>
                    of {formatCurrency(budget.amount)}
                  </Text>
                </View>
                
                {isOverBudget && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={COLORS.accentRed} />
                    <Text style={styles.warningText}>
                      Over budget by {formatCurrency(budget.spent - budget.amount)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Budget</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Budget name"
              placeholderTextColor={COLORS.textMuted}
              value={newBudget.name}
              onChangeText={(text) => setNewBudget({ ...newBudget, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              placeholderTextColor={COLORS.textMuted}
              value={newBudget.category}
              onChangeText={(text) => setNewBudget({ ...newBudget, category: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor={COLORS.textMuted}
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({ ...newBudget, amount: text })}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateBudget}
            >
              <Text style={styles.createButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  budgetCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  budgetName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  budgetPeriod: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  budgetCategory: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.borderColor,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: `${COLORS.accentRed}20`,
    borderRadius: BORDER_RADIUS.md,
  },
  warningText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accentRed,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: SPACING.lg,
  },
  createButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
});

export default BudgetsScreen;
