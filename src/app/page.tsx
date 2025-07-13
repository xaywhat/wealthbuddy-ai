'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ArrowRight,
  Brain,
  Target,
  Trophy,
  BarChart3,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account_name?: string;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'alert' | 'trend' | 'achievement';
  title: string;
  message: string;
  savings_potential?: number;
  category?: string;
  created_at: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const { getPeriodLabel } = useTimePeriod();

  useEffect(() => {
    const userData = localStorage.getItem('wealthbuddy_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadDashboardData(parsedUser.id);
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [
        financialRes,
        accountsRes,
        transactionsRes,
        insightsRes
      ] = await Promise.all([
        fetch(`/api/financial-summary?userId=${userId}`),
        fetch(`/api/data/accounts?userId=${userId}`),
        fetch(`/api/data/transactions?userId=${userId}&limit=5`),
        fetch(`/api/insights?userId=${userId}&limit=3`)
      ]);

      // Process financial summary
      if (financialRes.ok) {
        const data = await financialRes.json();
        if (data.success) {
          setFinancialSummary(data.summary);
        }
      }

      // Process accounts
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        if (data.success) {
          setAccounts(data.accounts || []);
          setIsConnected(data.accounts.length > 0);
        }
      }

      // Process recent transactions
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        if (data.success) {
          setRecentTransactions(data.transactions || []);
        }
      }

      // Process AI insights
      if (insightsRes.ok) {
        const data = await insightsRes.json();
        if (data.success) {
          setAIInsights(data.insights || []);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const getTotalAccountBalance = () => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
      'MobilePay': '📱',
      'Income': '💰',
      'Internal Transfer': '🔄',
      'Uncategorized': '❓',
    };
    return iconMap[category] || '📊';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return '💡';
      case 'alert': return '⚠️';
      case 'trend': return '📈';
      case 'achievement': return '🏆';
      default: return '🤖';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: 'var(--accent-blue)', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Wallet size={40} color="white" />
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            Welcome to WealthBuddy AI
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            maxWidth: '400px',
            margin: '0 auto 32px'
          }}>
            Connect your bank account to start tracking your finances and get AI-powered insights
          </p>
          <Link href="/profile" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Connect Bank Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Welcome Section */}
      <div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          {getGreeting()}, {user?.keyphrase}! 👋
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '16px'
        }}>
          Here's your financial overview for {getPeriodLabel().toLowerCase()}
        </p>
      </div>

      {/* Financial Overview */}
      {financialSummary && (
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
              {formatCurrency(financialSummary.totalIncome)}
            </div>
            <div className="stat-label">Total Income</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              This {getPeriodLabel().toLowerCase()}
            </div>
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
              {formatCurrency(Math.abs(financialSummary.totalExpenses))}
            </div>
            <div className="stat-label">Total Expenses</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              This {getPeriodLabel().toLowerCase()}
            </div>
          </div>

          <div className="stat-card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: financialSummary.netAmount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              borderRadius: '12px',
              margin: '0 auto 16px'
            }}>
              <DollarSign size={24} color="white" />
            </div>
            <div className={`stat-value ${financialSummary.netAmount >= 0 ? 'stat-positive' : 'stat-negative'}`}>
              {formatCurrency(financialSummary.netAmount)}
            </div>
            <div className="stat-label">Net Amount</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {financialSummary.netAmount >= 0 ? 'Positive' : 'Negative'}
            </div>
          </div>
        </div>
      )}

      {/* Account Balance */}
      {accounts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Account Balance</h3>
              <p className="card-subtitle">Across {accounts.length} accounts</p>
            </div>
            <Link href="/profile" className="btn btn-ghost">
              <Eye size={16} />
              View Details
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              {formatCurrency(getTotalAccountBalance())}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)'
            }}>
              Total Balance
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Brain size={20} style={{ marginRight: '8px', display: 'inline' }} />
                AI Insights
              </h3>
              <p className="card-subtitle">Personalized financial recommendations</p>
            </div>
            <Link href="/insights" className="btn btn-ghost">
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {aiInsights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="list-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: 'none' }}>
                <div className="list-item-icon">
                  <span style={{ fontSize: '20px' }}>{getInsightIcon(insight.type)}</span>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{insight.title}</div>
                  <div className="list-item-subtitle">{insight.message}</div>
                  {insight.savings_potential && (
                    <div style={{ 
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'var(--accent-green)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'inline-block'
                    }}>
                      Save {formatCurrency(insight.savings_potential)} per month
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Transactions</h3>
              <p className="card-subtitle">Latest {recentTransactions.length} transactions</p>
            </div>
            <Link href="/transactions" className="btn btn-ghost">
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div>
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="list-item">
                <div className="list-item-icon">
                  <span style={{ fontSize: '16px' }}>{getCategoryIcon(transaction.category)}</span>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{transaction.description}</div>
                  <div className="list-item-subtitle">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('da-DK')}
                  </div>
                </div>
                <div className={`list-item-value ${transaction.amount >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Manage your finances</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px' 
        }}>
          <Link href="/budgets?add=true" className="btn btn-secondary" style={{ 
            padding: '16px',
            flexDirection: 'column',
            height: 'auto',
            textAlign: 'center'
          }}>
            <Target size={24} style={{ marginBottom: '8px' }} />
            <span>Create Budget</span>
          </Link>

          <Link href="/goals?add=true" className="btn btn-secondary" style={{ 
            padding: '16px',
            flexDirection: 'column',
            height: 'auto',
            textAlign: 'center'
          }}>
            <Trophy size={24} style={{ marginBottom: '8px' }} />
            <span>Set Goal</span>
          </Link>

          <Link href="/categories" className="btn btn-secondary" style={{ 
            padding: '16px',
            flexDirection: 'column',
            height: 'auto',
            textAlign: 'center'
          }}>
            <BarChart3 size={24} style={{ marginBottom: '8px' }} />
            <span>View Categories</span>
          </Link>

          <Link href="/insights" className="btn btn-secondary" style={{ 
            padding: '16px',
            flexDirection: 'column',
            height: 'auto',
            textAlign: 'center'
          }}>
            <Brain size={24} style={{ marginBottom: '8px' }} />
            <span>AI Insights</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
