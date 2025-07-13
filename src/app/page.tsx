'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Target, 
  Trophy, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Brain,
  Calendar,
  PieChart,
  BarChart3,
  Wallet,
  Star,
  Award,
  ShoppingBag,
  Coffee,
  Car,
  Home as HomeIcon,
  ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
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

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  user_category?: string;
  creditor_name?: string;
  debtor_name?: string;
  account_id: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period_type: string;
  alert_threshold: number;
  is_active: boolean;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: string;
  is_active: boolean;
}

interface AIInsight {
  type: 'savings_opportunity' | 'spending_pattern' | 'budget_alert';
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: 'weekly' | 'monthly' | 'yearly';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  icon: string;
  rarity: string;
  earned_at?: string;
  progress_value?: number;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { selectedPeriod, customStartDate, customEndDate, getPeriodLabel } = useTimePeriod();

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

  // Reload data when time period changes
  useEffect(() => {
    if (user) {
      loadDashboardData(user.id);
    }
  }, [selectedPeriod, customStartDate, customEndDate, user]);

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build period parameters
      const periodParams = new URLSearchParams();
      periodParams.append('userId', userId);
      periodParams.append('period', selectedPeriod);
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        periodParams.append('startDate', customStartDate);
        periodParams.append('endDate', customEndDate);
      }

      // Load all dashboard data in parallel
      const [
        accountsRes,
        transactionsRes,
        summaryRes,
        budgetsRes,
        goalsRes,
        insightsRes,
        achievementsRes
      ] = await Promise.all([
        fetch(`/api/data/accounts?userId=${userId}`),
        fetch(`/api/data/transactions?userId=${userId}&limit=5`),
        fetch(`/api/financial-summary?${periodParams.toString()}`),
        fetch(`/api/budgets?userId=${userId}&limit=3`),
        fetch(`/api/goals?userId=${userId}&limit=3`),
        fetch(`/api/insights?userId=${userId}&limit=3`),
        fetch(`/api/achievements?userId=${userId}&recent=true&limit=3`)
      ]);

      // Process accounts
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success) {
          setBankAccounts(accountsData.accounts || []);
          setIsConnected(accountsData.accounts.length > 0);
        }
      }

      // Process transactions
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.success) {
          setRecentTransactions(transactionsData.transactions || []);
        }
      }

      // Process financial summary
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setFinancialSummary(summaryData.summary);
        }
      }

      // Process budgets
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        if (budgetsData.success) {
          setBudgets(budgetsData.budgets || []);
        }
      }

      // Process goals
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        if (goalsData.success) {
          setGoals(goalsData.goals || []);
        }
      }

      // Process AI insights
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.success) {
          setAiInsights(insightsData.insights || []);
        }
      }

      // Process achievements
      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        if (achievementsData.success) {
          setAchievements(achievementsData.achievements || []);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
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

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Internal Transfer': ArrowUpRight,
      'MobilePay': CreditCard,
      'Convenience Stores': ShoppingBag,
      'Bills': HomeIcon,
      'Gas': Car,
      'Groceries': ShoppingBag,
      'Transport': Car,
      'Entertainment': Star,
      'Dining': Coffee,
      'Shopping': ShoppingBag,
      'Healthcare': Plus,
      'Income': TrendingUp,
      'Subscriptions': Calendar,
      'Uncategorized': BarChart3,
    };
    const IconComponent = iconMap[category] || BarChart3;
    return <IconComponent className="w-4 h-4" />;
  };

  const getEffectiveCategory = (transaction: Transaction): string => {
    return transaction.user_category || transaction.category || 'Uncategorized';
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          {/* Loading skeleton with dark theme */}
          <div className="space-y-6">
            <div className="glass-card h-40 loading-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card h-32 loading-pulse"></div>
              <div className="glass-card h-32 loading-pulse"></div>
            </div>
            <div className="glass-card h-60 loading-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="p-6">
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Welcome to WealthBuddy!
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Connect your Danish bank account to start tracking your finances with AI-powered insights and smart budgeting tools.
            </p>
            <Link
              href="/dashboard"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Connect Bank Account</span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Welcome Hero Section */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, <span className="gradient-text">{user?.keyphrase}</span>! 👋
              </h1>
              <p className="text-gray-400 text-lg mb-6">
                Here's your financial overview for {getPeriodLabel().toLowerCase()}
              </p>
              
              {/* Quick Stats */}
              {financialSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 bg-green-500/10 border-green-500/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-green-400">Total Income</h3>
                        <p className="text-xs text-gray-400">{getPeriodLabel()}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(financialSummary.totalIncome)}
                    </p>
                  </div>

                  <div className="glass-card p-6 bg-red-500/10 border-red-500/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-red-400">Total Expenses</h3>
                        <p className="text-xs text-gray-400">{getPeriodLabel()}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(Math.abs(financialSummary.totalExpenses))}
                    </p>
                  </div>

                  <div className={`glass-card p-6 ${
                    financialSummary.netAmount >= 0 
                      ? 'bg-blue-500/10 border-blue-500/20' 
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        financialSummary.netAmount >= 0 ? 'bg-blue-500/20' : 'bg-red-500/20'
                      }`}>
                        <DollarSign className={`w-6 h-6 ${
                          financialSummary.netAmount >= 0 ? 'text-blue-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${
                          financialSummary.netAmount >= 0 ? 'text-blue-400' : 'text-red-400'
                        }`}>Net Worth</h3>
                        <p className="text-xs text-gray-400">Overall position</p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${
                      financialSummary.netAmount >= 0 ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(financialSummary.netAmount)}
                    </p>
                    <div className="mt-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        financialSummary.netAmount >= 0 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {financialSummary.netAmount >= 0 ? '💰 Positive' : '⚠️ Negative'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden lg:block ml-8">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
                <PieChart className="w-16 h-16 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Account Balance Summary */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Account Balance</h3>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary text-sm inline-flex items-center space-x-2"
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold gradient-text mb-2">
              {formatCurrency(bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </p>
            <p className="text-gray-400">
              Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Budget Progress</h3>
              </div>
              <Link 
                href="/budgets" 
                className="btn-secondary text-sm inline-flex items-center space-x-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-6">
              {budgets.slice(0, 3).map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                const isOverBudget = percentage > 100;
                const isNearLimit = percentage > budget.alert_threshold * 100;

                return (
                  <div key={budget.id} className="glass-card p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-white">{budget.name}</h4>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </p>
                        <p className={`text-xs font-medium ${
                          isOverBudget ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {percentage.toFixed(1)}% used
                        </p>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          isNearLimit ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                          'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Over budget!</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals Progress */}
        {goals.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Financial Goals</h3>
              </div>
              <Link 
                href="/goals" 
                className="btn-secondary text-sm inline-flex items-center space-x-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-6">
              {goals.slice(0, 3).map((goal) => {
                const percentage = (goal.current_amount / goal.target_amount) * 100;
                const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={goal.id} className="glass-card p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-white">{goal.name}</h4>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </p>
                        <p className="text-xs font-medium text-purple-400">
                          {percentage.toFixed(1)}% complete
                        </p>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">AI Insights</h3>
              </div>
              <Link 
                href="/insights" 
                className="btn-secondary text-sm inline-flex items-center space-x-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {aiInsights.slice(0, 2).map((insight, index) => (
                <div key={index} className="glass-card bg-yellow-500/10 border-yellow-500/20 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-400 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                      {insight.potentialSavings > 0 && (
                        <p className="text-sm font-medium text-yellow-400">
                          💰 Save {formatCurrency(insight.potentialSavings)} per {insight.timeframe}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
              </div>
              <Link 
                href="/transactions" 
                className="btn-secondary text-sm inline-flex items-center space-x-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                        {getCategoryIcon(getEffectiveCategory(transaction))}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {getEffectiveCategory(transaction)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.date).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.amount)}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Recent Achievements</h3>
              </div>
              <Link 
                href="/achievements" 
                className="btn-secondary text-sm inline-flex items-center space-x-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="glass-card p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{achievement.name}</p>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-400">+{achievement.points} pts</p>
                      <p className="text-xs text-gray-500">{achievement.rarity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/budgets?add=true"
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <p className="font-semibold text-white text-sm">Create Budget</p>
              <p className="text-xs text-gray-400">Set spending limits</p>
            </Link>
            
            <Link
              href="/goals?add=true"
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-semibold text-white text-sm">Set Goal</p>
              <p className="text-xs text-gray-400">Save for something</p>
            </Link>
            
            <Link
              href="/subscriptions"
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <p className="font-semibold text-white text-sm">Subscriptions</p>
              <p className="text-xs text-gray-400">Manage recurring</p>
            </Link>
            
            <Link
              href="/insights"
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="font-semibold text-white text-sm">AI Insights</p>
              <p className="text-xs text-gray-400">Get recommendations</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
