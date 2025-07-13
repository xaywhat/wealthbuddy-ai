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

export default function TransactionsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{category: string, confidence: number, reasoning: string} | null>(null);
  const [suggestedForTransaction, setSuggestedForTransaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial filters from URL params
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

    // Set initial filters from URL
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [router, categoryFromUrl]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch(`/api/data/transactions?userId=${userId}`),
        fetch(`/api/categories?userId=${userId}`)
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

    } catch (error) {
      console.error('Error loading transactions data:', error);
      setError('Failed to load transactions data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
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

  const getCategorySourceIcon = (transaction: Transaction) => {
    const source = transaction.category_source || 'auto';
    switch (source) {
      case 'manual': return '👤'; // User manually set
      case 'rule': return '⚡'; // Rule-based
      case 'auto': 
      default: return '🤖'; // AI/automatic
    }
  };

  const getCategorySourceColor = (transaction: Transaction) => {
    const source = transaction.category_source || 'auto';
    switch (source) {
      case 'manual': return 'bg-green-100 text-green-800';
      case 'rule': return 'bg-blue-100 text-blue-800';
      case 'auto':
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Apply all filters
  useEffect(() => {
    let filtered = [...transactions];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(transaction => 
        getEffectiveCategory(transaction) === selectedCategory
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
  }, [transactions, selectedCategory, searchQuery, sortBy, sortOrder]);

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
        setAiSuggestion(null);
        setSuggestedForTransaction(null);
      } else {
        alert('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleSuggestCategory = async (transaction: Transaction) => {
    if (!user) return;

    try {
      setSuggestingFor(transaction.id);
      setAiSuggestion(null);

      const response = await fetch('/api/transactions/suggest-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestion) {
          setAiSuggestion(data.suggestion);
          setSuggestedForTransaction(transaction.id);
        }
      } else {
        alert('Failed to get AI suggestion');
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      alert('Failed to get AI suggestion');
    } finally {
      setSuggestingFor(null);
    }
  };

  const applyAiSuggestion = (transactionId: string) => {
    if (aiSuggestion) {
      handleUpdateTransactionCategory(transactionId, aiSuggestion.category);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* AI Suggestion Modal */}
        {aiSuggestion && suggestedForTransaction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">🤖 AI Category Suggestion</h4>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Suggested:</strong> {aiSuggestion.category} 
                  <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                    {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                  </span>
                </p>
                <p className="text-sm text-blue-700 mb-3">{aiSuggestion.reasoning}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => applyAiSuggestion(suggestedForTransaction)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Apply Suggestion
                  </button>
                  <button
                    onClick={() => {
                      setAiSuggestion(null);
                      setSuggestedForTransaction(null);
                    }}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory 
                  ? 'Try adjusting your filters or search query'
                  : 'Connect your bank account to see transactions here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">💳</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {transaction.description}
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
                            <div className="flex items-center space-x-1">
                              <span 
                                className={`text-xs px-2 py-1 rounded-full cursor-pointer ${getCategorySourceColor(transaction)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTransaction(transaction.id);
                                }}
                                title={`${getEffectiveCategory(transaction)} (${transaction.category_source || 'auto'})`}
                              >
                                {getCategorySourceIcon(transaction)} {getEffectiveCategory(transaction)}
                              </span>
                              
                              {/* AI Suggest Button */}
                              {getEffectiveCategory(transaction) === 'Uncategorized' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSuggestCategory(transaction);
                                  }}
                                  disabled={suggestingFor === transaction.id}
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {suggestingFor === transaction.id ? '🔄' : '🤖'} Suggest
                                </button>
                              )}
                            </div>
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

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Category Source Legend</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">👤 Manual</span>
              <span className="text-gray-600">User categorized</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">⚡ Rule</span>
              <span className="text-gray-600">Rule-based</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">🤖 Auto</span>
              <span className="text-gray-600">AI categorized</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
