'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Eye,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: string;
  is_active: boolean;
  created_at: string;
  description?: string;
}

export default function GoalsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    goal_type: 'savings' as 'savings' | 'debt_reduction' | 'investment' | 'emergency_fund' | 'vacation' | 'purchase',
    description: ''
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

      const response = await fetch(`/api/goals?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGoals(data.goals || []);
        }
      }

    } catch (error) {
      console.error('Error loading goals data:', error);
      setError('Failed to load goals data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = getGoalProgress(goal);
    const daysRemaining = getDaysRemaining(goal.target_date);
    
    if (progress >= 100) return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/10' };
    if (daysRemaining < 0) return { status: 'overdue', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (daysRemaining <= 30) return { status: 'urgent', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    return { status: 'on_track', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
  };

  const getProgressBarColor = (goal: Goal) => {
    const progress = getGoalProgress(goal);
    if (progress >= 100) return 'bg-gradient-to-r from-green-500 to-green-600';
    const daysRemaining = getDaysRemaining(goal.target_date);
    if (daysRemaining <= 30) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-blue-500 to-blue-600';
  };

  const handleCreateGoal = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date || !newGoal.goal_type) {
      setError('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(newGoal.target_amount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError('Please enter a valid target amount greater than 0');
      return;
    }

    const targetDate = new Date(newGoal.target_date);
    const today = new Date();
    if (targetDate <= today) {
      setError('Target date must be in the future');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goal: {
            name: newGoal.name,
            target_amount: targetAmount,
            target_date: newGoal.target_date,
            goal_type: newGoal.goal_type,
            current_amount: 0,
            is_active: true
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewGoal({
          name: '',
          target_amount: '',
          target_date: '',
          goal_type: 'savings',
          description: ''
        });
        setShowCreateModal(false);
      } else {
        setError(data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal - please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/goals?goalId=${goalId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        setError(data.error || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal');
    }
  };

  const getGoalTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'savings': DollarSign,
      'debt_reduction': TrendingDown,
      'investment': TrendingUp,
      'emergency_fund': Target,
      'vacation': '✈️',
      'purchase': '🛍️'
    };
    const IconComponent = iconMap[type];
    return typeof IconComponent === 'string' ? IconComponent : <IconComponent className="w-6 h-6" />;
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'savings': 'Savings',
      'debt_reduction': 'Debt Reduction',
      'investment': 'Investment',
      'emergency_fund': 'Emergency Fund',
      'vacation': 'Vacation',
      'purchase': 'Purchase'
    };
    return labels[type] || type;
  };

  const getTotalTargetAmount = () => {
    return goals.filter(g => g.is_active).reduce((sum, g) => sum + g.target_amount, 0);
  };

  const getTotalCurrentAmount = () => {
    return goals.filter(g => g.is_active).reduce((sum, g) => sum + g.current_amount, 0);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-6">
          <div className="glass-card h-40 loading-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card h-32 loading-pulse"></div>
            <div className="glass-card h-32 loading-pulse"></div>
          </div>
          <div className="glass-card h-60 loading-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Goals</h1>
          <p className="text-gray-400">Track your progress towards financial milestones</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card bg-red-500/10 border-red-500/20 p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Goals Overview */}
      {goals.filter(g => g.is_active).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Goals Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-3xl font-bold gradient-text mb-1">
                {formatCurrency(getTotalTargetAmount())}
              </p>
              <p className="text-gray-400">Total Target</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {formatCurrency(getTotalCurrentAmount())}
              </p>
              <p className="text-gray-400">Total Saved</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((getTotalCurrentAmount() / getTotalTargetAmount()) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {((getTotalCurrentAmount() / getTotalTargetAmount()) * 100).toFixed(1)}% of total goals achieved
            </p>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <div className="space-y-6">
        {goals.filter(g => g.is_active).length > 0 ? (
          goals.filter(g => g.is_active).map((goal) => {
            const progress = getGoalProgress(goal);
            const status = getGoalStatus(goal);
            const daysRemaining = getDaysRemaining(goal.target_date);
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <div key={goal.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{getGoalTypeIcon(goal.goal_type)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{goal.name}</h3>
                      <p className="text-gray-400">
                        {getGoalTypeLabel(goal.goal_type)} • Due {new Date(goal.target_date).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowEditModal(true);
                      }}
                      className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Goal Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">
                      {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                    </span>
                    <span className={`font-medium ${status.color}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressBarColor(goal)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Goal Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(remaining)}
                    </p>
                    <p className="text-xs text-gray-400">Remaining</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-white">
                      {Math.abs(daysRemaining)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {daysRemaining > 0 ? 'Days Left' : 'Days Overdue'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-lg font-bold text-white">
                      {daysRemaining > 0 ? formatCurrency(remaining / daysRemaining) : '---'}
                    </p>
                    <p className="text-xs text-gray-400">Daily Target</p>
                  </div>
                </div>

                {/* Goal Status Alerts */}
                {progress >= 100 && (
                  <div className="glass-card bg-green-500/10 border-green-500/20 p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 font-medium">
                        🎉 Goal achieved! Congratulations!
                      </p>
                    </div>
                  </div>
                )}

                {daysRemaining < 0 && progress < 100 && (
                  <div className="glass-card bg-red-500/10 border-red-500/20 p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 font-medium">
                        Goal is {Math.abs(daysRemaining)} days overdue
                      </p>
                    </div>
                  </div>
                )}

                {daysRemaining <= 30 && daysRemaining > 0 && progress < 100 && (
                  <div className="glass-card bg-yellow-500/10 border-yellow-500/20 p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-400 font-medium">
                        Only {daysRemaining} days left to reach this goal
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/transactions?goal=${encodeURIComponent(goal.name)}`)}
                    className="btn-secondary text-sm inline-flex items-center space-x-2 flex-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Transactions</span>
                  </button>
                  <button
                    onClick={() => router.push(`/budgets?add=true&goal=${encodeURIComponent(goal.name)}`)}
                    className="btn-secondary text-sm inline-flex items-center space-x-2 flex-1"
                  >
                    <Target className="w-4 h-4" />
                    <span>Create Budget</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No Financial Goals</h3>
            <p className="text-gray-400 mb-6">
              Set your first financial goal to start building your future
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Create New Goal</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund, Vacation to Japan"
                  className="modern-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Target Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                  placeholder="50000"
                  className="modern-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="modern-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Goal Type
                </label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value as any }))}
                  className="modern-input w-full"
                >
                  <option value="savings">Savings</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation</option>
                  <option value="purchase">Major Purchase</option>
                  <option value="investment">Investment</option>
                  <option value="debt_reduction">Debt Reduction</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={!newGoal.name || !newGoal.target_amount || !newGoal.target_date || submitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
