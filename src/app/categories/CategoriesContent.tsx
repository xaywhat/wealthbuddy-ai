'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
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
  creditor_name?: string;
  debtor_name?: string;
  account_id: string;
}

interface CategorizationRule {
  id: string;
  keyword: string;
  category: string;
  rule_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  priority: number;
}

export default function CategoriesContent() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as 'expense' | 'income' });
  const [newRule, setNewRule] = useState({ keyword: '', category: '', ruleType: 'contains' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
      setShowCategoryModal(true);
    }
  }, [router, shouldOpenAddModal]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        transactionsRes,
        categoriesRes,
        rulesRes
      ] = await Promise.all([
        fetch(`/api/data/transactions?userId=${userId}`),
        fetch(`/api/categories?userId=${userId}`),
        fetch(`/api/categories/rules?userId=${userId}`)
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.success) {
          setTransactions(transactionsData.transactions || []);
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setAvailableCategories(categoriesData.categories || []);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setCategorizationRules(rulesData.rules || []);
      }

    } catch (error) {
      console.error('Error loading categories data:', error);
      setError('Failed to load categories data');
    } finally {
      setLoading(false);
    }
  };

  // Category helper functions
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Internal Transfer': '🔄',
      'MobilePay': '📱',
      'Convenience Stores': '🏪',
      'Bills': '📄',
      'Gas': '⛽',
      'Groceries': '🛒',
      'Transport': '🚌',
      'Entertainment': '🎬',
      'Dining': '🍽️',
      'Shopping': '🛍️',
      'Healthcare': '🏥',
      'Income': '💰',
      'Subscriptions': '📺',
      'Insurance': '🛡️',
      'Rent': '🏠',
      'Utilities': '💡',
      'Education': '📚',
      'Fitness': '💪',
      'Beauty': '💄',
      'Gifts': '🎁',
      'Travel': '✈️',
      'Parking': '🅿️',
      'ATM': '🏧',
      'Investment': '📈',
      'Loans': '💳',
      'Fees': '💸',
      'Pet Care': '🐕',
      'Home Improvement': '🔨',
      'Clothing': '👕',
      'Charity': '❤️',
      'Uncategorized': '❓',
    };
    return icons[category] || '📊';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Internal Transfer': 'bg-gray-100 text-gray-800',
      'MobilePay': 'bg-purple-100 text-purple-800',
      'Convenience Stores': 'bg-orange-100 text-orange-800',
      'Bills': 'bg-red-100 text-red-800',
      'Gas': 'bg-yellow-100 text-yellow-800',
      'Groceries': 'bg-green-100 text-green-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Dining': 'bg-amber-100 text-amber-800',
      'Shopping': 'bg-indigo-100 text-indigo-800',
      'Healthcare': 'bg-teal-100 text-teal-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Subscriptions': 'bg-violet-100 text-violet-800',
      'Uncategorized': 'bg-gray-100 text-gray-600',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  const getEffectiveCategory = (transaction: Transaction): string => {
    return transaction.user_category || transaction.category || 'Uncategorized';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  // Time period filtering
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: new Date(now) };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date(now) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      case 'last_3_months': {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo, end: new Date(now) };
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate + 'T23:59:59') 
          };
        }
        return null;
      }
      default:
        return null;
    }
  };

  const filterTransactionsByPeriod = (transactions: Transaction[], period: string) => {
    if (period === 'all') return transactions;
    
    const dateRange = getDateRange(period);
    if (!dateRange) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  };

  // Update filtered transactions when period changes
  useEffect(() => {
    const filtered = filterTransactionsByPeriod(transactions, selectedPeriod);
    setFilteredTransactions(filtered);
  }, [transactions, selectedPeriod, customStartDate, customEndDate]);

  // Get category totals
  const getCategoryTotals = () => {
    const transactionsToUse = selectedPeriod === 'all' ? transactions : filteredTransactions;
    const grouped: Record<string, Transaction[]> = {};
    
    transactionsToUse.forEach(transaction => {
      const category = getEffectiveCategory(transaction);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(transaction);
    });

    const totals: Record<string, { amount: number; count: number; trend: number }> = {};
    Object.entries(grouped).forEach(([category, transactions]) => {
      const amount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate real trend based on transaction dates
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
      const previousTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });
      
      const recentAmount = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const previousAmount = previousTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      let trend = 0;
      if (previousAmount > 0) {
        trend = ((recentAmount - previousAmount) / previousAmount) * 100;
      } else if (recentAmount > 0) {
        trend = 100; // New spending category
      }
      
      totals[category] = { 
        amount, 
        count: transactions.length,
        trend: Math.min(Math.max(trend, -99), 99) // Cap at ±99%
      };
    });
    
    return totals;
  };

  // Category management functions
  const handleCreateCategory = async () => {
    if (!user || !newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'create',
          categoryName: newCategory.name.trim(),
          categoryType: newCategory.type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewCategory({ name: '', type: 'expense' });
        setShowCategoryModal(false);
        alert(`Category "${newCategory.name}" created successfully!`);
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!user) return;

    const defaultCategories = [
      'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
      'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Stores',
      'Internal Transfer', 'Income', 'Uncategorized'
    ];

    if (defaultCategories.includes(categoryName)) {
      alert('Cannot delete default categories');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"? All transactions in this category will be marked as uncategorized.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/delete?userId=${user.id}&category=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert(data.message);
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCreateRule = async () => {
    if (!user || !newRule.keyword || !newRule.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/categories/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          keyword: newRule.keyword,
          category: newRule.category,
          ruleType: newRule.ruleType,
          priority: 0,
        }),
      });

      if (response.ok) {
        await loadData(user.id);
        setNewRule({ keyword: '', category: '', ruleType: 'contains' });
        setShowRulesModal(false);
        alert('Rule created successfully!');
      } else {
        alert('Failed to create rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/categories/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (user) {
          await loadData(user.id);
        }
        alert('Rule deleted successfully!');
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage your spending categories and rules</p>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Add Category</p>
                <p className="text-xs text-gray-600">Create new category</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowRulesModal(true)}
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">⚙️</span>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Add Rule</p>
                <p className="text-xs text-gray-600">Auto-categorization</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowCategoryList(!showCategoryList)}
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl">📝</span>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Manage Categories</p>
                <p className="text-xs text-gray-600">Edit & delete</p>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/transactions')}
              className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-2xl">🎯</span>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">View Transactions</p>
                <p className="text-xs text-gray-600">See all transactions</p>
              </div>
            </button>
          </div>
        </div>

        {/* Category Management List */}
        {showCategoryList && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Manage Categories</h4>
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {availableCategories.map((category) => {
                const isDefault = [
                  'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
                  'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Stores',
                  'Internal Transfer', 'Income', 'Uncategorized'
                ].includes(category);
                
                return (
                  <div key={category} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="font-medium text-gray-900">{category}</span>
                      {isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                    {!isDefault && (
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Overview Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Category Overview</h3>
            <div className="text-sm text-gray-500">
              {selectedPeriod === 'all' ? 'All time' : 
               selectedPeriod === 'custom' && customStartDate && customEndDate ? 
               `${customStartDate} to ${customEndDate}` :
               selectedPeriod.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 overflow-y-auto">
            {Object.entries(getCategoryTotals())
              .sort(([,a], [,b]) => b.amount - a.amount)
              .map(([category, data]) => (
                <div key={category} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer">
                  <div className="text-center space-y-3">
                    {/* Category Icon */}
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getCategoryColor(category)}`}>
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                    </div>
                    
                    {/* Category Name */}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{category}</h4>
                      <p className="text-xs text-gray-500">{data.count} transactions</p>
                    </div>
                    
                    {/* Amount */}
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.amount)}
                      </p>
                      <div className="flex items-center justify-center space-x-1">
                        <span className={`text-xs ${data.trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {data.trend >= 0 ? '↗' : '↘'} {Math.abs(data.trend).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Category Progress Bar */}
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((data.amount / Math.max(...Object.values(getCategoryTotals()).map(c => c.amount))) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick Actions for Category */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => router.push(`/transactions?category=${encodeURIComponent(category)}`)}
                        className="text-xs bg-blue-100 text-blue-700 py-2 px-3 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Transactions
                      </button>
                      <button
                        onClick={() => router.push(`/budgets?add=true&category=${encodeURIComponent(category)}`)}
                        className="text-xs bg-green-100 text-green-700 py-2 px-3 rounded hover:bg-green-200 transition-colors"
                      >
                        Set Budget
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Rules Overview */}
        {categorizationRules.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Active Rules</h3>
              <button
                onClick={() => setShowRulesModal(true)}
                className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              >
                Add Rule
              </button>
            </div>
            
            <div className="space-y-3">
              {categorizationRules.slice(0, 5).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                      "{rule.keyword}"
                    </span>
                    <span className="text-sm text-gray-500">→</span>
                    <span className={`text-sm px-2 py-1 rounded ${getCategoryColor(rule.category)}`}>
                      {rule.category}
                    </span>
                    <span className="text-xs text-gray-400">({rule.rule_type})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
              
              {categorizationRules.length > 5 && (
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all {categorizationRules.length} rules
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 'Coffee Shops', 'Gym Membership'"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Type
                </label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as 'expense' | 'income' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Creation Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create Categorization Rule</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  value={newRule.keyword}
                  onChange={(e) => setNewRule(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="e.g., 'netto', 'spotify', 'mobilepay'"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Transactions containing this keyword will be automatically categorized
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="">Select a category</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <select
                  value={newRule.ruleType}
                  onChange={(e) => setNewRule(prev => ({ ...prev, ruleType: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="contains">Contains keyword</option>
                  <option value="starts_with">Starts with keyword</option>
                  <option value="ends_with">Ends with keyword</option>
                  <option value="exact">Exact match</option>
                </select>
              </div>

              {/* Show existing rules */}
              {categorizationRules.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Rules</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {categorizationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                        <div className="text-xs">
                          <span className="font-medium">"{rule.keyword}"</span>
                          <span className="text-gray-500"> → {rule.category}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={!newRule.keyword || !newRule.category}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
