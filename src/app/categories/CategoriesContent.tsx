'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Target, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  X,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Category {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  priority: number;
  created_at: string;
}

export default function CategoriesContent() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    pattern: '',
    category: '',
    priority: 1
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPeriodLabel } = useTimePeriod();

  useEffect(() => {
    const userData = localStorage.getItem('wealthbuddy_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadData(parsedUser.id);
  }, [router]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, rulesRes] = await Promise.all([
        fetch(`/api/categories?userId=${userId}`),
        fetch(`/api/categories/rules?userId=${userId}`)
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categoryData || []);
        }
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        if (rulesData.success) {
          setCategoryRules(rulesData.rules || []);
        }
      }

    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories data');
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

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-red-400" />;
      case 'down': return <TrendingDown size={16} className="text-green-400" />;
      default: return <DollarSign size={16} className="text-gray-400" />;
    }
  };

  const getProgressBarWidth = (percentage: number) => {
    return Math.min(percentage, 100);
  };

  const filteredCategories = categories.filter(category =>
    category.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRule = async () => {
    if (!user || !newRule.pattern || !newRule.category) {
      setError('Please fill in all required fields');
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
          rule: newRule
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewRule({ pattern: '', category: '', priority: 1 });
        setShowAddRule(false);
      } else {
        setError(data.error || 'Failed to create rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      setError('Failed to create rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/categories/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        setError(data.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      setError('Failed to delete rule');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="loading">Loading categories...</div>
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
          Categories
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '16px'
        }}>
          Manage your spending categories and rules for {getPeriodLabel().toLowerCase()}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Manage categories and rules</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px' 
        }}>
          <button
            onClick={() => setShowAddRule(true)}
            className="btn btn-secondary"
            style={{ 
              padding: '16px',
              flexDirection: 'column',
              height: 'auto',
              textAlign: 'center'
            }}
          >
            <Plus size={24} style={{ marginBottom: '8px' }} />
            <span>Add Rule</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-categorization</span>
          </button>

          <button
            onClick={() => router.push('/transactions')}
            className="btn btn-secondary"
            style={{ 
              padding: '16px',
              flexDirection: 'column',
              height: 'auto',
              textAlign: 'center'
            }}
          >
            <Eye size={24} style={{ marginBottom: '8px' }} />
            <span>View Transactions</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>See all transactions</span>
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
            <Target size={24} style={{ marginBottom: '8px' }} />
            <span>Create Budget</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Set spending limits</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Category Overview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Category Overview</h3>
            <p className="card-subtitle">
              {filteredCategories.length} categories • {getPeriodLabel()}
            </p>
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredCategories.map((category) => (
              <div key={category.category} className="card" style={{ 
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onClick={() => router.push(`/transactions?category=${encodeURIComponent(category.category)}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <span style={{ fontSize: '24px' }}>{getCategoryIcon(category.category)}</span>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)'
                      }}>
                        {category.category}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getTrendIcon(category.trend)}
                        <span style={{ 
                          fontSize: '18px', 
                          fontWeight: '700',
                          color: 'var(--text-primary)'
                        }}>
                          {formatCurrency(Math.abs(category.total_amount))}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)'
                      }}>
                        {category.transaction_count} transactions
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)'
                      }}>
                        {category.percentage.toFixed(1)}% of total
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress">
                      <div 
                        className="progress-bar primary"
                        style={{ width: `${getProgressBarWidth(category.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div style={{ marginLeft: '16px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/budgets?add=true&category=${encodeURIComponent(category.category)}`);
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '8px' }}
                    >
                      <Target size={16} />
                    </button>
                  </div>
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
            <BarChart3 size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
            <p>No categories found</p>
          </div>
        )}
      </div>

      {/* Categorization Rules */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Categorization Rules</h3>
            <p className="card-subtitle">Automatic transaction categorization</p>
          </div>
          <button
            onClick={() => setShowAddRule(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add Rule
          </button>
        </div>

        {categoryRules.length > 0 ? (
          <div>
            {categoryRules.map((rule) => (
              <div key={rule.id} className="list-item">
                <div className="list-item-icon">
                  <Settings size={20} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">
                    Pattern: "{rule.pattern}"
                  </div>
                  <div className="list-item-subtitle">
                    Category: {rule.category} • Priority: {rule.priority}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="btn btn-ghost"
                  style={{ color: 'var(--accent-red)', padding: '8px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'var(--text-secondary)'
          }}>
            <Settings size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
            <p>No categorization rules set up</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Add rules to automatically categorize transactions
            </p>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Add Categorization Rule
              </h3>
              <button
                onClick={() => setShowAddRule(false)}
                className="btn btn-ghost"
                style={{ padding: '8px' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Pattern</label>
                <input
                  type="text"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule(prev => ({ ...prev, pattern: e.target.value }))}
                  placeholder="e.g., Netto, REMA, grocery"
                  className="input"
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Text pattern to match in transaction descriptions
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRule.priority}
                  onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="input"
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Higher priority rules are applied first (1-10)
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddRule(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!newRule.pattern || !newRule.category}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
