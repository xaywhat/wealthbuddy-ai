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
import { goalsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, GOAL_TYPES } from '@/constants';
import type { Goal } from '@/types';

const GoalsScreen = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    goal_type: 'savings',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const data = await goalsAPI.getGoals(user.id);
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!user || !newGoal.name || !newGoal.target_amount || !newGoal.target_date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await goalsAPI.createGoal(user.id, {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
      });
      
      setModalVisible(false);
      setNewGoal({ name: '', target_amount: '', target_date: '', goal_type: 'savings' });
      loadGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Set your first financial goal and start saving</Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const goalType = GOAL_TYPES.find(type => type.key === goal.goal_type);
            
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <Text style={styles.goalIcon}>{goalType?.icon || '🎯'}</Text>
                    <Text style={styles.goalName}>{goal.name}</Text>
                  </View>
                  <Text style={styles.goalType}>{goalType?.label || goal.goal_type}</Text>
                </View>
                
                <View style={styles.goalProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? COLORS.accentGreen : COLORS.accentBlue
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>
                
                <View style={styles.goalAmounts}>
                  <Text style={styles.currentAmount}>
                    {formatCurrency(goal.current_amount)}
                  </Text>
                  <Text style={styles.targetAmount}>
                    of {formatCurrency(goal.target_amount)}
                  </Text>
                </View>
                
                <Text style={styles.targetDate}>
                  Target: {new Date(goal.target_date).toLocaleDateString()}
                </Text>
                
                {progress >= 100 && (
                  <View style={styles.achievedContainer}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.accentGreen} />
                    <Text style={styles.achievedText}>Goal Achieved! 🎉</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Goal name"
              placeholderTextColor={COLORS.textMuted}
              value={newGoal.name}
              onChangeText={(text: string) => setNewGoal({ ...newGoal, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Target amount"
              placeholderTextColor={COLORS.textMuted}
              value={newGoal.target_amount}
              onChangeText={(text: string) => setNewGoal({ ...newGoal, target_amount: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Target date (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textMuted}
              value={newGoal.target_date}
              onChangeText={(text: string) => setNewGoal({ ...newGoal, target_date: text })}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGoal}
            >
              <Text style={styles.createButtonText}>Create Goal</Text>
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
  goalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  goalName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  goalType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  goalProgress: {
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
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  currentAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  targetAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  targetDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
  },
  achievedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: `${COLORS.accentGreen}20`,
    borderRadius: BORDER_RADIUS.md,
  },
  achievedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accentGreen,
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

export default GoalsScreen;
