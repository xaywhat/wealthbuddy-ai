'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: 'savings' | 'debt_payoff' | 'investment' | 'emergency_fund' | 'vacation' | 'purchase' | 'other';
  category?: string;
  is_active: boolean;
  created_at: string;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  auto_calculate: boolean;
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface GoalProgress {
  goalId: string;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  monthlyTargetAmount: number;
  onTrack: boolean;
  projectedCompletionDate: string;
}

export default function GoalsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    goalType: 'savings' as Goal['goal_type'],
    category: '',
    priority: 'medium' as Goal['priority'],
    autoCalculate: true
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPeriodLabel } = useTimePeriod();

  // Check if we should open add modal
  const shouldOpenAddModal = searchParams.get('add') === 'true';

  useEffect(() => {
    const userData = localStorage.getItem('wealthbuddy_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadData(parsedUser.id);

    // Open add modal if needed
    if (shouldOpenAddModal) {
      setShowCreateModal(true);
    }
  }, [router, shouldOpenAddModal]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load goals, bank accounts for balance tracking
      const [goalsRes, accountsRes] = await Promise.all([
        fetch(`/api/goals?userId=${userId}`),
        fetch(`/api/data/accounts?userId=${userId}`)
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        if (goalsData.success) {
          setGoals(goalsData.goals || []);
          
          // Calculate progress for each goal
          const progressData: Record<string, GoalProgress> = {};
          (goalsData.goals || []).forEach((goal: Goal) => {
            progressData[goal.id] = calculateGoalProgress(goal);
          });
          setGoalProgress(progressData);
        }
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success) {
          setBankAccounts(accountsData.accounts || []);
        }
      }

    } catch (error) {
      console.error('Error loading goals data:', error);
      setError('Failed to load goals data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalProgress = (goal: Goal): GoalProgress => {
    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
    
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const daysRemaining = Math.max(
      Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      0
    );
    
    const monthsRemaining = Math.max(daysRemaining / 30, 1);
    const monthlyTarget = remaining / monthsRemaining;
    
    // Calculate if on track (simplified)
    const expectedProgress = daysRemaining > 0 ? 
      Math.max(0, 100 - ((daysRemaining / Math.ceil((targetDate.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24))) * 100)) 
      : 100;
    const onTrack = progress >= expectedProgress * 0.9; // 10% tolerance
    
    // Project completion date based on current progress rate
    const daysSinceStart = Math.max(
      Math.ceil((today.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
    const dailyProgress = goal.current_amount / daysSinceStart;
    const daysToComplete = dailyProgress > 0 ? Math.ceil(remaining / dailyProgress) : 999;
    const projectedDate = new Date(today.getTime() + (daysToComplete * 24 * 60 * 60 * 1000));
    
    return {
      goalId: goal.id,
      progressPercentage: progress,
      remainingAmount: remaining,
      daysRemaining,
      monthlyTargetAmount: monthlyTarget,
      onTrack,
      projectedCompletionDate: projectedDate.toISOString().split('T')[0]
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getGoalIcon = (goalType: string) => {
    const icons: Record<string, string> = {
      'savings': '💰',
      'debt_payoff': '💳',
      'investment': '📈',
      'emergency_fund': '🚨',
      'vacation': '✈️',
      'purchase': '🛍️',
      'other': '🎯'
    };
    return icons[goalType] || '🎯';
  };

  const getGoalTypeLabel = (goalType: string) => {
    const labels: Record<string, string> = {
      'savings': 'Savings Goal',
      'debt_payoff': 'Debt Payoff',
      'investment': 'Investment Goal',
      'emergency_fund': 'Emergency Fund',
      'vacation': 'Vacation Fund',
      'purchase': 'Purchase Goal',
      'other': 'Other Goal'
    };
    return labels[goalType] || 'Goal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressBarColor = (progress: GoalProgress) => {
    if (progress.progressPercentage >= 100) return 'bg-green-500';
    if (!progress.onTrack) return 'bg-red-500';
    if (progress.progressPercentage >= 75) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'create',
          goal: {
            title: newGoal.title,
            description: newGoal.description || null,
            targetAmount: parseFloat(newGoal.targetAmount),
            targetDate: newGoal.targetDate,
            goalType: newGoal.goalType,
            category: newGoal.category || null,
            priority: newGoal.priority,
            autoCalculate: newGoal.autoCalculate
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewGoal({
          title: '',
          description: '',
          targetAmount: '',
          targetDate: '',
          goalType: 'savings',
          category: '',
          priority: 'medium',
          autoCalculate: true
        });
        setShowCreateModal(false);
        alert('Goal created successfully!');
      } else {
        alert(data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!user || !editingGoal) return;

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goalId: editingGoal.id,
          goal: editingGoal
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setEditingGoal(null);
        setShowEditModal(false);
        alert('Goal updated successfully!');
      } else {
        alert(data.error || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals?userId=${user.id}&goalId=${goalId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert('Goal deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  const handleToggleGoalStatus = async (goal: Goal) => {
    if (!user) return;

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goalId: goal.id,
          goal: {
            ...goal,
            is_active: !goal.is_active
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        alert(data.error || 'Failed to update goal status');
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
      alert('Failed to update goal status');
    }
  };

  const handleUpdateGoalAmount = async (goalId: string, newAmount: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goalId,
          action: 'update_amount',
          currentAmount: newAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        alert(data.error || 'Failed to update goal amount');
      }
    } catch (error) {
      console.error('Error updating goal amount:', error);
      alert('Failed to update goal amount');
    }
  };

  const handleMarkGoalComplete = async (goalId: string) => {
    if (!user) return;

    if (!confirm('Mark this goal as completed?')) {
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goalId,
          action: 'mark_complete'
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert('🎉 Congratulations! Goal marked as completed!');
      } else {
        alert(data.error || 'Failed to mark goal as complete');
      }
    } catch (error) {
      console.error('Error marking goal as complete:', error);
      alert('Failed to mark goal as complete');
    }
  };

  const getActiveGoals = () => goals.filter(g => g.is_active && !g.completed_at);
  const getCompletedGoals = () => goals.filter(g => g.completed_at);
  const getInactiveGoals = () => goals.filter(g => !g.is_active && !g.completed_at);

  const getTotalGoalAmount = () => {
    return getActiveGoals().reduce((sum, g) => sum + g.target_amount, 0);
  };

  const getTotalSavedAmount = () => {
    return getActiveGoals().reduce((sum, g) => sum + g.current_amount, 0);
  };

  const getOverallProgress = () => {
    const total = getTotalGoalAmount();
    const saved = getTotalSavedAmount();
    return total > 0 ? (saved / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
            <p className="text-gray-600">Track your savings and financial objectives</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Set Goal
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Goals Overview */}
        {getActiveGoals().length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Goals Overview</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getTotalGoalAmount())}
                </p>
                <p className="text-sm text-gray-600">Total Target</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalSavedAmount())}
                </p>
                <p className="text-sm text-gray-600">Total Saved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {getActiveGoals().length}
                </p>
                <p className="text-sm text-gray-600">Active Goals</p>
              </div>
            </div>
            <div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getOverallProgress(), 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {getOverallProgress().toFixed(1)}% of total goals achieved
              </p>
            </div>
          </div>
        )}

        {/* Active Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Active Goals</h3>
          
          {getActiveGoals().length > 0 ? (
            getActiveGoals().map((goal) => {
              const progress = goalProgress[goal.id];
              if (!progress) return null;

              return (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">{getGoalIcon(goal.goal_type)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{getGoalTypeLabel(goal.goal_type)}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                            {goal.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleGoalStatus(goal)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-gray-600 text-sm mb-4">{goal.description}</p>
                  )}

                  {/* Goal Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {progress.progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(progress)}`}
                        style={{ width: `${progress.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Goal Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(progress.remainingAmount)}
                      </p>
                      <p className="text-xs text-gray-500">Remaining</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {progress.daysRemaining}
                      </p>
                      <p className="text-xs text-gray-500">Days Left</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(progress.monthlyTargetAmount)}
                      </p>
                      <p className="text-xs text-gray-500">Monthly Target</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(goal.target_date).toLocaleDateString('da-DK')}
                      </p>
                      <p className="text-xs text-gray-500">Target Date</p>
                    </div>
                  </div>

                  {/* Goal Status Alerts */}
                  {progress.progressPercentage >= 100 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        🎉 Goal achieved! Congratulations on reaching your target!
                      </p>
                      <button
                        onClick={() => handleMarkGoalComplete(goal.id)}
                        className="mt-2 text-green-700 hover:text-green-900 text-sm underline"
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}

                  {!progress.onTrack && progress.progressPercentage < 100 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm font-medium">
                        ⚠️ Behind schedule
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Projected completion: {new Date(progress.projectedCompletionDate).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  )}

                  {progress.onTrack && progress.progressPercentage < 100 && progress.progressPercentage > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">
                        ✅ On track to reach your goal!
                      </p>
                    </div>
                  )}

                  {/* Manual Amount Update */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Update amount:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={goal.current_amount.toString()}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                      onBlur={(e) => {
                        const newAmount = parseFloat(e.target.value);
                        if (!isNaN(newAmount) && newAmount !== goal.current_amount) {
                          handleUpdateGoalAmount(goal.id, newAmount);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => router.push(`/transactions?add=true&goal=${encodeURIComponent(goal.title)}`)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Goals</h3>
              <p className="text-gray-600 mb-4">
                Set your first financial goal to start building your future
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Set Your First Goal
              </button>
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {getCompletedGoals().length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Completed Goals 🏆</h3>
            <div className="space-y-3">
              {getCompletedGoals().map((goal) => (
                <div key={goal.id} className="flex items-center justify-between bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getGoalIcon(goal.goal_type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(goal.target_amount)} • Completed on{' '}
                        {goal.completed_at ? new Date(goal.completed_at).toLocaleDateString('da-DK') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold">✓ Complete</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Goals */}
        {getInactiveGoals().length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Paused Goals</h3>
            <div className="space-y-3">
              {getInactiveGoals().map((goal) => (
                <div key={goal.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 opacity-60">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getGoalIcon(goal.goal_type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleGoalStatus(goal)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Set New Goal</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Emergency Fund, Vacation to Japan"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <select
                  value={newGoal.goalType}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, goalType: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="savings">Savings Goal</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation Fund</option>
                  <option value="purchase">Purchase Goal</option>
                  <option value="debt_payoff">Debt Payoff</option>
                  <option value="investment">Investment Goal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  placeholder="10000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal and motivation..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCalculate"
                  checked={newGoal.autoCalculate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, autoCalculate: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="autoCalculate" className="text-sm text-gray-700">
                  Auto-calculate progress from account balances
                </label>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditModal && editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Goal</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <select
                  value={editingGoal.goal_type}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, goal_type: e.target.value as any } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="savings">Savings Goal</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation Fund</option>
                  <option value="purchase">Purchase Goal</option>
                  <option value="debt_payoff">Debt Payoff</option>
                  <option value="investment">Investment Goal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingGoal.target_amount}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, target_amount: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingGoal.current_amount}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, current_amount: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={editingGoal.target_date}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, target_date: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={editingGoal.priority}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Current Progress</p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(editingGoal.current_amount)} of {formatCurrency(editingGoal.target_amount)}
                  {goalProgress[editingGoal.id] && ` (${goalProgress[editingGoal.id].progressPercentage.toFixed(1)}%)`}
                </p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGoal}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Update Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
