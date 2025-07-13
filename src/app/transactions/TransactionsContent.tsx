'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  CreditCard, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Edit3, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  BarChart3,
  X,
  Sparkles
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account_name?: string;
  is_categorized_automatically?: boolean;
  confidence_score?: number;
}

export default function TransactionsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // all, income, expense
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPeriodLabel } = useTimePeriod();

  // Get initial filters from URL params
  const initialCategory = searchParams.get('category');
  const initialGoal = searchParams.get('goal');

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
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [router, initialCategory, initialGoal]);

  // Apply filters when transactions or filter criteria change
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter);
    }

    // Type filter
    if (typeFilter === 'income') {
      filtered = filtered.filter(transaction => transaction.amount > 0);
    } else if (typeFilter === 'expense') {
      filtered = filtered.filter(transaction => transaction.amount < 0);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, categoryFilter, typeFilter]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch(`/api/data/transactions?userId=${userId}&limit=100`),
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
        if (categoriesData.success) {
          setAvailableCategories(categoriesData.categories || []);
        }
      }

    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions data');
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

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
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

  const getTransactionStats = () => {
    const totalIncome = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const netAmount = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netAmount };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
    setShowFilters(false);
  };

  const { totalIncome, totalExpenses, netAmount } = getTransactionStats();

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          Transactions
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '16px'
        }}>
          {filteredTransactions.length} transactions for {getPeriodLabel().toLowerCase()}
          {categoryFilter && ` in ${categoryFilter}`}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Transaction Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--accent-green)',
            borderRadius: '12px',
            margin: '0 auto 16px'
          }}>
            <ArrowUpRight size={24} color="white" />
          </div>
          <div className="stat-value stat-positive">
            {formatCurrency(totalIncome)}
          </div>
          <div className="stat-label">Total Income</div>
        </div>

        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--accent-red)',
            borderRadius: '12px',
            margin: '0 auto 16px'
          }}>
            <ArrowDownRight size={24} color="white" />
          </div>
          <div className="stat-value stat-negative">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="stat-label">Total Expenses</div>
        </div>

        <div className="stat-card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: netAmount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            borderRadius: '12px',
            margin: '0 auto 16px'
          }}>
            <DollarSign size={24} color="white" />
          </div>
          <div className={`stat-value ${netAmount >= 0 ? 'stat-positive' : 'stat-negative'}`}>
            {formatCurrency(netAmount)}
          </div>
          <div className="stat-label">Net Amount</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: showFilters ? '16px' : '0' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter size={16} />
            Filters
          </button>

          {/* Clear Filters */}
          {(searchTerm || categoryFilter || typeFilter) && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <div>
              <label className="form-label">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Transaction History</h3>
            <p className="card-subtitle">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
          <button className="btn btn-ghost">
            <Download size={16} />
            Export
          </button>
        </div>

        {filteredTransactions.length > 0 ? (
          <div>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="list-item">
                <div className="list-item-icon">
                  <span style={{ fontSize: '20px' }}>{getCategoryIcon(transaction.category)}</span>
                </div>
                
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="list-item-title">{transaction.description}</div>
                    {transaction.is_categorized_automatically && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--accent-blue)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        <Sparkles size={10} />
                        AI
                      </div>
                    )}
                  </div>
                  <div className="list-item-subtitle">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('da-DK')}
                    {transaction.account_name && ` • ${transaction.account_name}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`list-item-value ${transaction.amount >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </div>
                  <button
                    onClick={() => router.push(`/transactions/${transaction.id}`)}
                    className="btn btn-ghost"
                    style={{ padding: '8px' }}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'var(--text-secondary)'
          }}>
            <CreditCard size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
            <p>No transactions found</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              {(searchTerm || categoryFilter || typeFilter) 
                ? 'Try adjusting your filters'
                : 'Connect your bank account to see transactions'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Manage your transactions</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '12px' 
        }}>
          <button
            onClick={() => router.push('/categories')}
            className="btn btn-secondary"
            style={{ 
              padding: '16px',
              flexDirection: 'column',
              height: 'auto',
              textAlign: 'center'
            }}
          >
            <BarChart3 size={24} style={{ marginBottom: '8px' }} />
            <span>View Categories</span>
          </button>

          <button
            onClick={() => router.push('/budgets?add=true')}
            className="btn btn-secondary"
            style={{ 
              padding: '16px',
              flexDirection: 'column',
              height: 'auto',
              textAlign: 'center'
            }}
          >
            <Calendar size={24} style={{ marginBottom: '8px' }} />
            <span>Create Budget</span>
          </button>

          <button
            onClick={() => router.push('/insights')}
            className="btn btn-secondary"
            style={{ 
              padding: '16px',
              flexDirection: 'column',
              height: 'auto',
              textAlign: 'center'
            }}
          >
            <Sparkles size={24} style={{ marginBottom: '8px' }} />
            <span>AI Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
}
