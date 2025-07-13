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

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  spent_amount: number;
  is_active: boolean;
  created_at: string;
  alert_threshold: number;
  description?: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  user_category?: string;
  category_source?: 'auto' | 'manual' | 'rule';
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
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    alertThreshold: '80',
    description: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getDateRange, getPeriodLabel } = useTimePeriod();

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

      // Load budgets, categories, and spending data
      const [budgetsRes, categoriesRes, spendingRes] = await Promise.all([
        fetch(`/api/budgets?userId=${userId}`),
        fetch(`/api/categories?userId=${userId}`),
        fetch(`/api/budgets/spending?userId=${userId}`)
      ]);

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        if (budgetsData.success) {
          setBudgets(budgetsData.budgets || []);
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setAvailableCategories(categoriesData.categories || []);
      }

      if (spendingRes.ok) {
        const spendingData = await spendingRes.json();
        if (spendingData.success) {
          setCategorySpending(spendingData.spending || []);
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
    return Math.min((budget.spent_amount / budget.amount) * 100, 100);
  };

  const getBudgetStatus = (budget: Budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return { status: 'exceeded', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (progress >= budget.alert_threshold) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const getProgressBarColor = (budget: Budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return 'bg-red-500';
    if (progress >= budget.alert_threshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRemainingAmount = (budget: Budget) => {
    return Math.max(budget.amount - budget.spent_amount, 0);
  };

  const getRemainingDays = (budget: Budget) => {
    const endDate = new Date(budget.end_date || getNextPeriodEnd(budget.start_date, budget.period));
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const getNextPeriodEnd = (startDate: string, period: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    
    switch (period) {
      case 'weekly':
        end.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(start.getMonth() + 1);
        break;
      case 'yearly':
        end.setFullYear(start.getFullYear() + 1);
        break;
    }
    
    return end.toISOString().split('T')[0];
  };

  const getSpendingVelocity = (budget: Budget) => {
    const daysElapsed = Math.max(
      Math.ceil((new Date().getTime() - new Date(budget.start_date).getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
    return budget.spent_amount / daysElapsed;
  };

  const getDaysUntilBudgetExceeded = (budget: Budget) => {
    const velocity = getSpendingVelocity(budget);
    if (velocity <= 0) return null;
    
    const remaining = getRemainingAmount(budget);
    return Math.ceil(remaining / velocity);
  };

  const handleCreateBudget = async () => {
    // Enhanced validation
    if (!user) {
      alert('User not authenticated');
      return;
    }

    if (!newBudget.category || !newBudget.amount || !newBudget.period) {
      alert('Please fill in all required fields (Category, Amount, and Period)');
      return;
    }

    const amount = parseFloat(newBudget.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const alertThreshold = parseInt(newBudget.alertThreshold);
    if (isNaN(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
      alert('Alert threshold must be between 0 and 100');
      return;
    }

    try {
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
            period_type: newBudget.period,
            alert_threshold: alertThreshold / 100,
            description: newBudget.description || null
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewBudget({
          category: '',
          amount: '',
          period: 'monthly',
          alertThreshold: '80',
          description: ''
        });
        setShowCreateModal(false);
        // Use better success notification
        alert('✅ Budget created successfully!');
      } else {
        alert(`❌ Failed to create budget: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('❌ Failed to create budget - please try again');
    }
  };

  const handleUpdateBudget = async () => {
    if (!user || !editingBudget) return;

    try {
      const response = await fetch('/api/budgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          budgetId: editingBudget.id,
          budget: editingBudget
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setEditingBudget(null);
        setShowEditModal(false);
        alert('Budget updated successfully!');
      } else {
        alert(data.error || 'Failed to update budget');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets?userId=${user.id}&budgetId=${budgetId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert('Budget deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget');
    }
  };

  const handleToggleBudgetStatus = async (budget: Budget) => {
    if (!user) return;

    try {
      const response = await fetch('/api/budgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          budgetId: budget.id,
          budget: {
            ...budget,
            is_active: !budget.is_active
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        alert(data.error || 'Failed to update budget status');
      }
    } catch (error) {
      console.error('Error updating budget status:', error);
      alert('Failed to update budget status');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
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
    return icons[category] || '📊';
  };

  const getUnbudgetedCategories = () => {
    const budgetedCategories = budgets.filter(b => b.is_active).map(b => b.category);
    return categorySpending.filter(cs => 
      !budgetedCategories.includes(cs.category) && 
      cs.category !== 'Internal Transfer' &&
      cs.category !== 'Income' &&
      cs.spent > 0
    );
  };

  const getTotalBudgetedAmount = () => {
    return budgets.filter(b => b.is_active).reduce((sum, b) => sum + b.amount, 0);
  };

  const getTotalSpentAmount = () => {
    return budgets.filter(b => b.is_active).reduce((sum, b) => sum + b.spent_amount, 0);
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
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600">Manage your spending budgets for {getPeriodLabel()}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Create Budget
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Budget Overview */}
        {budgets.filter(b => b.is_active).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getTotalBudgetedAmount())}
                </p>
                <p className="text-sm text-gray-600">Total Budgeted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalSpentAmount())}
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((getTotalSpentAmount() / getTotalBudgetedAmount()) * 100, 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {((getTotalSpentAmount() / getTotalBudgetedAmount()) * 100).toFixed(1)}% of total budget used
              </p>
            </div>
          </div>
        )}

        {/* Active Budgets */}
        <div className="space-y-4">
          {budgets.filter(b => b.is_active).length > 0 ? (
            budgets.filter(b => b.is_active).map((budget) => {
              const progress = getBudgetProgress(budget);
              const status = getBudgetStatus(budget);
              const remaining = getRemainingAmount(budget);
              const remainingDays = getRemainingDays(budget);
              const daysUntilExceeded = getDaysUntilBudgetExceeded(budget);

              return (
                <div key={budget.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">{getCategoryIcon(budget.category)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                        <p className="text-sm text-gray-500">
                          {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                          {budget.description && ` • ${budget.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingBudget(budget);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleBudgetStatus(budget)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        {budget.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.amount)}
                      </span>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(budget)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(remaining)}
                      </p>
                      <p className="text-xs text-gray-500">Remaining</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {remainingDays}
                      </p>
                      <p className="text-xs text-gray-500">Days Left</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(getSpendingVelocity(budget))}
                      </p>
                      <p className="text-xs text-gray-500">Daily Avg</p>
                    </div>
                  </div>

                  {/* Budget Alerts */}
                  {progress >= 100 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">
                        ⚠️ Budget exceeded by {formatCurrency(budget.spent_amount - budget.amount)}
                      </p>
                    </div>
                  )}

                  {progress >= budget.alert_threshold && progress < 100 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm font-medium">
                        ⚠️ {budget.alert_threshold}% of budget used
                        {daysUntilExceeded && daysUntilExceeded > 0 && (
                          <span className="block mt-1">
                            At current rate, budget will be exceeded in {daysUntilExceeded} days
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => router.push(`/transactions?category=${encodeURIComponent(budget.category)}`)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                    >
                      View Transactions
                    </button>
                    <button
                      onClick={() => router.push(`/categories?category=${encodeURIComponent(budget.category)}`)}
                      className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200"
                    >
                      Categorize Transactions
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Budgets</h3>
              <p className="text-gray-600 mb-4">
                Create your first budget to start tracking your spending goals
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Budget
              </button>
            </div>
          )}
        </div>

        {/* Unbudgeted Categories */}
        {getUnbudgetedCategories().length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Categories Without Budgets
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              These categories have spending activity but no budget assigned
            </p>
            <div className="space-y-3">
              {getUnbudgetedCategories().map((categoryData) => (
                <div key={categoryData.category} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getCategoryIcon(categoryData.category)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{categoryData.category}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(categoryData.spent)} spent • {categoryData.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewBudget(prev => ({ 
                        ...prev, 
                        category: categoryData.category,
                        amount: Math.ceil(categoryData.spent * 1.2).toString() // Suggest 20% more than current spending
                      }));
                      setShowCreateModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create Budget
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Budgets */}
        {budgets.filter(b => !b.is_active).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Inactive Budgets</h3>
            <div className="space-y-3">
              {budgets.filter(b => !b.is_active).map((budget) => (
                <div key={budget.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 opacity-60">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getCategoryIcon(budget.category)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{budget.category}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(budget.amount)} • {budget.period}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleBudgetStatus(budget)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
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

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Budget</h3>
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
                  Category
                </label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Period
                </label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBudget.alertThreshold}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, alertThreshold: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll be alerted when spending reaches this percentage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newBudget.description}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Monthly grocery budget"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
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
                  onClick={handleCreateBudget}
                  disabled={!newBudget.category || !newBudget.amount}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && editingBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Budget</h3>
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
                  Category
                </label>
                <input
                  type="text"
                  value={editingBudget.category}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Category cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Period
                </label>
                <select
                  value={editingBudget.period}
                  onChange={(e) => setEditingBudget(prev => prev ? { ...prev, period: e.target.value as any } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingBudget.alert_threshold}
                  onChange={(e) => setEditingBudget(prev => prev ? { ...prev, alert_threshold: parseInt(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={editingBudget.description || ''}
                  onChange={(e) => setEditingBudget(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="e.g., Monthly grocery budget"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Current Progress</p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(editingBudget.spent_amount)} spent of {formatCurrency(editingBudget.amount)} 
                  ({getBudgetProgress(editingBudget).toFixed(1)}%)
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
                  onClick={handleUpdateBudget}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Update Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
