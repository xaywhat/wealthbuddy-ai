'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  Play, 
  Pause, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Activity,
  Eye,
  BarChart3,
  X
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period_type: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  description?: string;
}

interface CategorySpending {
  category: string;
  spent: number;
  transactionCount: number;
}

export default function BudgetsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period_type: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    alert_threshold: '80',
    description: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPeriodLabel } = useTimePeriod();

  // Check if we should open add modal
  const shouldOpenAddModal = searchParams.get('add') === 'true';
  const categoryFromUrl = searchParams.get('category');

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
      if (categoryFromUrl) {
        setNewBudget(prev => ({ ...prev, category: categoryFromUrl }));
      }
    }
  }, [router, shouldOpenAddModal, categoryFromUrl]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load budgets and categories
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch(`/api/budgets?userId=${userId}`),
        fetch(`/api/categories?userId=${userId}`)
      ]);

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        if (budgetsData.success) {
          setBudgets(budgetsData.budgets || []);
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setAvailableCategories(categoriesData.categories || []);
        }
      }

    } catch (error) {
      console.error('Error loading budgets data:', error);
      setError('Failed to load budgets data');
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

  const getBudgetProgress = (budget: Budget) => {
    return Math.min((budget.spent / budget.amount) * 100, 100);
  };

  const getBudgetStatus = (budget: Budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return { status: 'exceeded', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (progress >= budget.alert_threshold * 100) return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    return { status: 'good', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  const getProgressBarColor = (budget: Budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (progress >= budget.alert_threshold * 100) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-green-500 to-green-600';
  };

  const getRemainingAmount = (budget: Budget) => {
    return Math.max(budget.amount - budget.spent, 0);
  };

  const handleCreateBudget = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!newBudget.category || !newBudget.amount || !newBudget.period_type) {
      setError('Please fill in all required fields (Category, Amount, and Period)');
      return;
    }

    const amount = parseFloat(newBudget.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const alertThreshold = parseInt(newBudget.alert_threshold);
    if (isNaN(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
      setError('Alert threshold must be between 0 and 100');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          budget: {
            name: `${newBudget.category} Budget`,
            category: newBudget.category,
            amount: amount,
            period_type: newBudget.period_type,
            alert_threshold: alertThreshold / 100
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewBudget({
          category: '',
          amount: '',
          period_type: 'monthly',
          alert_threshold: '80',
          description: ''
        });
        setShowCreateModal(false);
      } else {
        setError(data.error || 'Failed to create budget');
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Failed to create budget - please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/budgets?budgetId=${budgetId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        setError(data.error || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Groceries': '🛒',
      'Transport': '🚌',
      'Dining': '🍽️',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Gas': '⛽',
      'Convenience Stores': '🏪',
      'MobilePay': '📱',
      'Subscriptions': '📺',
      'Insurance': '🛡️',
      'Rent': '🏠',
      'Utilities': '💡',
      'Education': '📚',
      'Fitness': '💪',
      'Beauty': '💄',
      'Gifts': '🎁',
      'Travel': '✈️',
      'Clothing': '👕',
      'Pet Care': '🐕',
      'Home Improvement': '🔨',
      'Charity': '❤️',
      'Investment': '📈',
      'Loans': '💳',
      'Fees': '💸',
      'ATM': '🏧',
      'Parking': '🅿️',
      'Income': '💰',
      'Internal Transfer': '🔄',
      'Uncategorized': '❓',
    };
    return iconMap[category] || '📊';
  };

  const getTotalBudgetedAmount = () => {
    return budgets.filter(b => b.is_active).reduce((sum, b) => sum + b.amount, 0);
  };

  const getTotalSpentAmount = () => {
    return budgets.filter(b => b.is_active).reduce((sum, b) => sum + b.spent, 0);
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
          <h1 className="text-3xl font-bold text-white mb-2">Budgets</h1>
          <p className="text-gray-400">Manage your spending budgets for {getPeriodLabel()}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Budget</span>
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

      {/* Budget Overview */}
      {budgets.filter(b => b.is_active).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Budget Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold gradient-text mb-1">
                {formatCurrency(getTotalBudgetedAmount())}
              </p>
              <p className="text-gray-400">Total Budgeted</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {formatCurrency(getTotalSpentAmount())}
              </p>
              <p className="text-gray-400">Total Spent</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((getTotalSpentAmount() / getTotalBudgetedAmount()) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {((getTotalSpentAmount() / getTotalBudgetedAmount()) * 100).toFixed(1)}% of total budget used
            </p>
          </div>
        </div>
      )}

      {/* Active Budgets */}
      <div className="space-y-6">
        {budgets.filter(b => b.is_active).length > 0 ? (
          budgets.filter(b => b.is_active).map((budget) => {
            const progress = getBudgetProgress(budget);
            const status = getBudgetStatus(budget);
            const remaining = getRemainingAmount(budget);

            return (
              <div key={budget.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{getCategoryIcon(budget.category)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{budget.name || budget.category}</h3>
                      <p className="text-gray-400">
                        {budget.period_type.charAt(0).toUpperCase() + budget.period_type.slice(1)} Budget
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingBudget(budget);
                        setShowEditModal(true);
                      }}
                      className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">
                      {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                    </span>
                    <span className={`font-medium ${status.color}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressBarColor(budget)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Budget Stats */}
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
                      <Activity className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-white">
                      {budget.alert_threshold * 100}%
                    </p>
                    <p className="text-xs text-gray-400">Alert At</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-lg font-bold text-white">
                      {budget.period_type}
                    </p>
                    <p className="text-xs text-gray-400">Period</p>
                  </div>
                </div>

                {/* Budget Alerts */}
                {progress >= 100 && (
                  <div className="glass-card bg-red-500/10 border-red-500/20 p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 font-medium">
                        Budget exceeded by {formatCurrency(budget.spent - budget.amount)}
                      </p>
                    </div>
                  </div>
                )}

                {progress >= budget.alert_threshold * 100 && progress < 100 && (
                  <div className="glass-card bg-yellow-500/10 border-yellow-500/20 p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-400 font-medium">
                        {(budget.alert_threshold * 100).toFixed(0)}% of budget used
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/transactions?category=${encodeURIComponent(budget.category)}`)}
                    className="btn-secondary text-sm inline-flex items-center space-x-2 flex-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Transactions</span>
                  </button>
                  <button
                    onClick={() => router.push(`/categories?category=${encodeURIComponent(budget.category)}`)}
                    className="btn-secondary text-sm inline-flex items-center space-x-2 flex-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Manage Category</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No Active Budgets</h3>
            <p className="text-gray-400 mb-6">
              Create your first budget to start tracking your spending goals
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Budget</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Create New Budget</h3>
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
                  Category
                </label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                  className="modern-input w-full"
                >
                  <option value="">Select a category</option>
                  {availableCategories.filter(cat => 
                    cat !== 'Internal Transfer' && 
                    cat !== 'Income' &&
                    !budgets.some(b => b.category === cat && b.is_active)
                  ).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Budget Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000"
                  className="modern-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Budget Period
                </label>
                <select
                  value={newBudget.period_type}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, period_type: e.target.value as any }))}
                  className="modern-input w-full"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBudget.alert_threshold}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, alert_threshold: e.target.value }))}
                  className="modern-input w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  You'll be alerted when spending reaches this percentage
                </p>
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
                  onClick={handleCreateBudget}
                  disabled={!newBudget.category || !newBudget.amount || submitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
