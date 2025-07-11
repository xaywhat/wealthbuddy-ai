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

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  iban?: string;
  last_sync_date?: string;
  sync_status: string;
}

export default function TransactionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'expense' | 'income'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial filters from URL params
  const categoryFromUrl = searchParams.get('category');
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

    // Set initial filters from URL
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }

    // Open add modal if needed
    if (shouldOpenAddModal) {
      setShowAddModal(true);
    }
  }, [router, categoryFromUrl, shouldOpenAddModal]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        transactionsRes,
        accountsRes,
        categoriesRes
      ] = await Promise.all([
        fetch(`/api/data/transactions?userId=${userId}`),
        fetch(`/api/data/accounts?userId=${userId}`),
        fetch(`/api/categories?userId=${userId}`)
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.success) {
          setTransactions(transactionsData.transactions || []);
        }
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success) {
          setBankAccounts(accountsData.accounts || []);
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setAvailableCategories(categoriesData.categories || []);
      }

    } catch (error) {
      console.error('Error loading transactions data:', error);
      setError('Failed to load transactions data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
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

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatTransactionDescription = (description: string) => {
    let cleaned = description;
    
    // Handle "Fra Forsikringer" case
    if (cleaned.toLowerCase().includes('fra forsikringer')) {
      return 'Fra Forsikringer';
    }
    
    // Handle MobilePay cases
    if (cleaned.toLowerCase().includes('mobilepay')) {
      const match = cleaned.match(/MobilePay\s+([^E]+?)(?:\s+EndToEndID|$)/i);
      if (match) {
        return `MobilePay ${match[1].trim()}`;
      }
    }
    
    // Remove EndToEndID and everything after it
    cleaned = cleaned.replace(/\s+EndToEndID:.*$/i, '');
    
    // Remove common noise patterns
    cleaned = cleaned.replace(/We have received the following payment from:?\s*/i, '');
    cleaned = cleaned.replace(/\s+\d{1,2},-?\d*\s+\d{4}\s+[A-ZÆØÅ\s]+$/i, ''); // Remove address patterns
    
    // Trim and clean up spacing
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Time period filtering
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today': {
        return { start: today, end: new Date(now) };
      }
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
      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: new Date(now) };
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

  // Apply all filters
  useEffect(() => {
    let filtered = [...transactions];

    // Time period filter
    if (selectedPeriod !== 'all') {
      const dateRange = getDateRange(selectedPeriod);
      if (dateRange) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        });
      }
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(transaction => 
        getEffectiveCategory(transaction) === selectedCategory
      );
    }

    // Account filter
    if (selectedAccount) {
      filtered = filtered.filter(transaction => 
        transaction.account_id === selectedAccount
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(query) ||
        transaction.creditor_name?.toLowerCase().includes(query) ||
        transaction.debtor_name?.toLowerCase().includes(query) ||
        getEffectiveCategory(transaction).toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case 'date':
          result = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          result = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'category':
          result = getEffectiveCategory(a).localeCompare(getEffectiveCategory(b));
          break;
      }
      return sortOrder === 'desc' ? -result : result;
    });

    setFilteredTransactions(filtered);
  }, [transactions, selectedPeriod, selectedCategory, selectedAccount, searchQuery, sortBy, sortOrder, customStartDate, customEndDate]);

  // Transaction management functions
  const handleUpdateTransactionCategory = async (transactionId: string, newCategory: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/categories/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          userId: user.id,
          newCategory,
        }),
      });

      if (response.ok) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t.id === transactionId 
            ? { ...t, user_category: newCategory, category_source: 'manual' as const }
            : t
        ));
        setEditingTransaction(null);
      } else {
        alert('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.description || !newTransaction.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const amount = parseFloat(newTransaction.amount);
      if (isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
      }

      // For expenses, make amount negative
      const finalAmount = newTransaction.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          description: newTransaction.description,
          amount: finalAmount,
          category: newTransaction.category || 'Uncategorized',
          date: newTransaction.date,
          accountId: bankAccounts[0]?.id || 'manual', // Use first account or manual
        }),
      });

      if (response.ok) {
        await loadData(user.id);
        setNewTransaction({
          description: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          type: 'expense'
        });
        setShowAddModal(false);
        alert('Transaction added successfully!');
      } else {
        alert('Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const handleBulkCategoryUpdate = async (categoryName: string) => {
    if (!user || selectedTransactions.size === 0) return;

    try {
      const response = await fetch('/api/categories/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          transactionIds: Array.from(selectedTransactions),
          newCategory: categoryName,
        }),
      });

      if (response.ok) {
        await loadData(user.id);
        setSelectedTransactions(new Set());
        setShowBulkActions(false);
        alert(`Updated ${selectedTransactions.size} transactions`);
      } else {
        alert('Failed to update transactions');
      }
    } catch (error) {
      console.error('Error updating transactions:', error);
      alert('Failed to update transactions');
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const clearFilters = () => {
    setSelectedPeriod('all');
    setSelectedCategory(null);
    setSelectedAccount(null);
    setSearchQuery('');
    setCustomStartDate('');
    setCustomEndDate('');
    // Update URL to remove category filter
    router.push('/transactions');
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">
              {filteredTransactions.length} of {transactions.length} transactions
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Time Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={selectedAccount || ''}
                onChange={(e) => setSelectedAccount(e.target.value || null)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
              >
                <option value="">All Accounts</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
            />
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="flex space-x-4 mb-4">
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
          )}

          {/* Clear Filters & Bulk Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Bulk Actions
              </button>
            </div>
            {selectedTransactions.size > 0 && (
              <div className="text-sm text-gray-600">
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">Bulk Actions</h3>
              <button
                onClick={() => setShowBulkActions(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Select transactions and choose an action. Click on transaction rows to select them.
            </p>
            <div className="flex space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value && selectedTransactions.size > 0) {
                    handleBulkCategoryUpdate(e.target.value);
                  }
                }}
                className="border border-blue-300 rounded px-3 py-1 text-sm bg-white"
                defaultValue=""
              >
                <option value="">Change category to...</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
                }}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedTransactions(new Set())}
                className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory || selectedPeriod !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'Connect your bank account to see transactions here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => showBulkActions && toggleTransactionSelection(transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {showBulkActions && (
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={() => toggleTransactionSelection(transaction.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                      
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getCategoryIcon(getEffectiveCategory(transaction))}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {formatTransactionDescription(transaction.description)}
                          </p>
                          {editingTransaction === transaction.id ? (
                            <select
                              value={getEffectiveCategory(transaction)}
                              onChange={(e) => handleUpdateTransactionCategory(transaction.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                            >
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <span 
                              className={`text-xs px-2 py-1 rounded-full cursor-pointer ${getCategoryColor(getEffectiveCategory(transaction))}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTransaction(transaction.id);
                              }}
                            >
                              {getEffectiveCategory(transaction)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('da-DK')}
                          </p>
                          <p className="text-xs text-gray-500">•</p>
                          <p className="text-xs text-gray-500">
                            {transaction.creditor_name || transaction.debtor_name || 'Unknown'}
                          </p>
                          {transaction.category_source && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-1 rounded">
                              {transaction.category_source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getTransactionColor(transaction.amount)}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Transaction</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., 'Coffee at Starbucks'"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (DKK)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'expense' | 'income' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
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
                  Date
                </label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  disabled={!newTransaction.description || !newTransaction.amount}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
