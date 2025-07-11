'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface AIInsight {
  id: string;
  type: 'savings_opportunity' | 'spending_pattern' | 'budget_alert' | 'goal_recommendation' | 'subscription_alert';
  title: string;
  description: string;
  potentialSavings?: number;
  timeframe: 'weekly' | 'monthly' | 'yearly';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  confidence: number;
  created_at: string;
}

interface SpendingAnalysis {
  categoryBreakdown: Record<string, { amount: number; percentage: number; trend: number }>;
  monthlyTrend: number;
  averageDailySpending: number;
  topCategories: string[];
  unusualSpending: Array<{ category: string; amount: number; reason: string }>;
}

export default function InsightsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatingInsights, setGeneratingInsights] = useState(false);
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
    loadInsights(parsedUser.id);
  }, [router]);

  const loadInsights = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load insights and spending analysis
      const [insightsRes, analysisRes] = await Promise.all([
        fetch(`/api/insights?userId=${userId}`),
        fetch(`/api/insights/analysis?userId=${userId}`)
      ]);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.success) {
          setInsights(insightsData.insights || []);
        }
      }

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        if (analysisData.success) {
          setSpendingAnalysis(analysisData.analysis);
        }
      }

    } catch (error) {
      console.error('Error loading insights:', error);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!user) return;

    try {
      setGeneratingInsights(true);
      
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadInsights(user.id);
        alert(`Generated ${data.count} new insights!`);
      } else {
        alert(data.error || 'Failed to generate insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    const icons: Record<string, string> = {
      'savings_opportunity': '💰',
      'spending_pattern': '📊',
      'budget_alert': '⚠️',
      'goal_recommendation': '🎯',
      'subscription_alert': '📺'
    };
    return icons[type] || '🤖';
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === selectedCategory);

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
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600">Personalized financial recommendations powered by AI</p>
          </div>
          <button
            onClick={generateNewInsights}
            disabled={generatingInsights}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {generatingInsights ? 'Generating...' : '🤖 Generate Insights'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Spending Analysis Overview */}
        {spendingAnalysis && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Analysis for {getPeriodLabel()}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(spendingAnalysis.averageDailySpending)}
                </p>
                <p className="text-sm text-gray-600">Average Daily Spending</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${spendingAnalysis.monthlyTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {spendingAnalysis.monthlyTrend >= 0 ? '+' : ''}{spendingAnalysis.monthlyTrend.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Monthly Trend</p>
              </div>
            </div>

            {/* Top Categories */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Top Spending Categories</h4>
              <div className="space-y-2">
                {spendingAnalysis.topCategories.slice(0, 5).map((category, index) => {
                  const categoryData = spendingAnalysis.categoryBreakdown[category];
                  if (!categoryData) return null;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">#{index + 1} {category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(categoryData.amount)} ({categoryData.percentage.toFixed(1)}%)
                        </span>
                        <span className={`text-xs ${categoryData.trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {categoryData.trend >= 0 ? '↗' : '↘'} {Math.abs(categoryData.trend).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unusual Spending */}
            {spendingAnalysis.unusualSpending.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Unusual Spending Detected</h4>
                <div className="space-y-2">
                  {spendingAnalysis.unusualSpending.map((item, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{item.category}</span>
                        <span className="text-sm font-bold text-yellow-700">{formatCurrency(item.amount)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insight Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Insights
            </button>
            <button
              onClick={() => setSelectedCategory('savings_opportunity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'savings_opportunity' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💰 Savings
            </button>
            <button
              onClick={() => setSelectedCategory('spending_pattern')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'spending_pattern' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Patterns
            </button>
            <button
              onClick={() => setSelectedCategory('budget_alert')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'budget_alert' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⚠️ Alerts
            </button>
            <button
              onClick={() => setSelectedCategory('goal_recommendation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'goal_recommendation' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🎯 Goals
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight) => (
              <div key={insight.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${getInsightColor(insight.priority)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getPriorityLabel(insight.priority)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {insight.confidence}% confidence
                        </span>
                        {insight.category && (
                          <span className="text-xs text-gray-500">• {insight.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(insight.created_at).toLocaleDateString('da-DK')}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{insight.description}</p>

                {insight.potentialSavings && insight.potentialSavings > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">💰</span>
                      <span className="text-sm font-medium text-green-800">
                        Potential savings: {formatCurrency(insight.potentialSavings)} per {insight.timeframe}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {insight.type === 'savings_opportunity' && (
                    <button
                      onClick={() => router.push('/budgets?add=true')}
                      className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200"
                    >
                      Create Budget
                    </button>
                  )}
                  {insight.type === 'goal_recommendation' && (
                    <button
                      onClick={() => router.push('/goals?add=true')}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                    >
                      Set Goal
                    </button>
                  )}
                  {insight.category && (
                    <button
                      onClick={() => router.push(`/transactions?category=${encodeURIComponent(insight.category || '')}`)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
                    >
                      View Transactions
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Insights Available</h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory === 'all' 
                  ? 'Generate your first AI insights to get personalized financial recommendations'
                  : 'No insights found for this category. Try generating new insights or select a different category.'
                }
              </p>
              <button
                onClick={generateNewInsights}
                disabled={generatingInsights}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {generatingInsights ? 'Generating...' : '🤖 Generate AI Insights'}
              </button>
            </div>
          )}
        </div>

        {/* Educational Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How AI Insights Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📊 Spending Analysis</h4>
              <p className="text-sm text-blue-800">
                Our AI analyzes your transaction patterns to identify spending trends, unusual purchases, and areas for improvement.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">💰 Savings Opportunities</h4>
              <p className="text-sm text-green-800">
                Discover where you can save money by reducing unnecessary expenses and optimizing your spending habits.
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">🎯 Goal Recommendations</h4>
              <p className="text-sm text-yellow-800">
                Get personalized suggestions for financial goals based on your income, expenses, and saving patterns.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">⚠️ Smart Alerts</h4>
              <p className="text-sm text-purple-800">
                Receive proactive notifications about budget limits, unusual spending, and subscription renewals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
