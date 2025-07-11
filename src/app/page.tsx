'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';

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
      setError(null);

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
        fetch(`/api/financial-summary?userId=${userId}&period=this_month`),
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
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

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
      'Uncategorized': '❓',
    };
    return icons[category] || '📊';
  };

  const getEffectiveCategory = (transaction: Transaction): string => {
    return transaction.user_category || transaction.category || 'Uncategorized';
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 space-y-4">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-6xl mb-4">🏦</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome to WealthBuddy!
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your Danish bank account to start tracking your finances with AI-powered insights.
            </p>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Connect Bank Account
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.keyphrase}! 👋
          </h1>
          <p className="text-blue-100">
            Here's your financial overview for this month
          </p>
        </div>

        {/* Financial Summary Cards */}
        {financialSummary && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💰</span>
                <span className="text-sm font-medium text-gray-600">Income</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(financialSummary.totalIncome)}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💸</span>
                <span className="text-sm font-medium text-gray-600">Expenses</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(financialSummary.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-gray-600">Net Amount</span>
              </div>
              <p className={`text-2xl font-bold ${financialSummary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialSummary.netAmount)}
              </p>
              <p className="text-xs text-gray-500">
                {financialSummary.transactionCount} transactions this month
              </p>
            </div>
          </div>
        )}

        {/* Account Balance Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Account Balance</h3>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              View Details
            </Link>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Budget Progress</h3>
              <Link href="/budgets" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {budgets.slice(0, 3).map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                const isOverBudget = percentage > 100;
                const isNearLimit = percentage > budget.alert_threshold * 100;

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{budget.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-red-500' :
                          isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      {isOverBudget && (
                        <span className="text-xs text-red-600">Over budget!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals Progress */}
        {goals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Financial Goals</h3>
              <Link href="/goals" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const percentage = (goal.current_amount / goal.target_amount) * 100;
                const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{goal.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-600">
                        {percentage.toFixed(1)}% complete
                      </span>
                      <span className="text-xs text-gray-500">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
              <Link href="/insights" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {aiInsights.slice(0, 2).map((insight, index) => (
                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                  {insight.potentialSavings > 0 && (
                    <p className="text-sm font-medium text-yellow-700 mt-2">
                      💰 Save {formatCurrency(insight.potentialSavings)} per {insight.timeframe}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
              <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">{getCategoryIcon(getEffectiveCategory(transaction))}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {getEffectiveCategory(transaction)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${getTransactionColor(transaction.amount)}`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Achievements</h3>
              <Link href="/achievements" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{achievement.name}</p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-blue-600">+{achievement.points} pts</p>
                    <p className="text-xs text-gray-500">{achievement.rarity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/budgets?add=true"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Create Budget</p>
                <p className="text-xs text-gray-600">Set spending limits</p>
              </div>
            </Link>
            
            <Link
              href="/goals?add=true"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Set Goal</p>
                <p className="text-xs text-gray-600">Save for something</p>
              </div>
            </Link>
            
            <Link
              href="/subscriptions"
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl">📺</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Subscriptions</p>
                <p className="text-xs text-gray-600">Manage recurring</p>
              </div>
            </Link>
            
            <Link
              href="/insights"
              className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">AI Insights</p>
                <p className="text-xs text-gray-600">Get recommendations</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
