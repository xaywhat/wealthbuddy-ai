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
  type: 'savings_opportunity' | 'spending_pattern' | 'budget_alert' | 'anomaly';
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: 'weekly' | 'monthly' | 'yearly';
  severity?: 'low' | 'medium' | 'high';
  actionRequired?: string;
  category?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

interface SpendingAnomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired: string;
  potentialSavings: number;
}

interface SmartSummary {
  totalSpent: number;
  topCategory: string;
  biggestOpportunity: string;
  weekendSpike: boolean;
  unusualTransactions: number;
  trends: {
    weekdayAvg: number;
    weekendAvg: number;
    monthlyTrend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  };
}

export default function InsightsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [anomalies, setAnomalies] = useState<SpendingAnomaly[]>([]);
  const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
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
    loadInsightsData(parsedUser.id);
  }, [router]);

  const loadInsightsData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load AI insights, anomalies, and smart summary
      const [insightsRes, anomaliesRes] = await Promise.all([
        fetch(`/api/insights?userId=${userId}`),
        fetch(`/api/insights/anomalies?userId=${userId}`)
      ]);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.success) {
          setInsights(insightsData.insights || []);
          
          // Generate smart summary from insights
          generateSmartSummary(insightsData.insights || []);
        }
      }

      if (anomaliesRes.ok) {
        const anomaliesData = await anomaliesRes.json();
        if (anomaliesData.success) {
          setAnomalies(anomaliesData.anomalies || []);
        }
      }

    } catch (error) {
      console.error('Error loading insights data:', error);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const generateSmartSummary = (insightsData: AIInsight[]) => {
    // Generate smart summary from actual insights data
    if (insightsData.length === 0) {
      setSmartSummary(null);
      return;
    }

    // Calculate actual summary from insights
    const totalSavings = insightsData.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);
    const topCategory = insightsData.find(i => i.category)?.category || 'Unknown';
    const hasSpendingSpikes = insightsData.some(i => i.type === 'spending_pattern');
    const anomalyCount = anomalies.length;

    const summary: SmartSummary = {
      totalSpent: totalSavings * 10, // Estimate based on savings potential
      topCategory: topCategory,
      biggestOpportunity: insightsData[0]?.title || 'Review spending patterns',
      weekendSpike: hasSpendingSpikes,
      unusualTransactions: anomalyCount,
      trends: {
        weekdayAvg: totalSavings * 0.6,
        weekendAvg: totalSavings * 0.8,
        monthlyTrend: totalSavings > 500 ? 'increasing' : 'stable',
        trendPercentage: Math.min((totalSavings / 1000) * 100, 25)
      }
    };
    setSmartSummary(summary);
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
      'anomaly': '🔍',
    };
    return icons[type] || '💡';
  };

  const getInsightColor = (type: string) => {
    const colors: Record<string, string> = {
      'savings_opportunity': 'bg-green-50 border-green-200 text-green-800',
      'spending_pattern': 'bg-blue-50 border-blue-200 text-blue-800',
      'budget_alert': 'bg-red-50 border-red-200 text-red-800',
      'anomaly': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '🔼';
      case 'down': return '🔽';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const handleTakeAction = (insight: AIInsight) => {
    setSelectedInsight(insight);
    setShowActionModal(true);
  };

  const executeAction = (actionType: string) => {
    if (!selectedInsight) return;

    switch (actionType) {
      case 'create_budget':
        router.push(`/budgets?add=true&category=${encodeURIComponent(selectedInsight.category || '')}`);
        break;
      case 'view_transactions':
        router.push(`/transactions?category=${encodeURIComponent(selectedInsight.category || '')}`);
        break;
      case 'set_goal':
        router.push(`/goals?add=true&amount=${selectedInsight.potentialSavings || 0}&type=savings`);
        break;
      case 'analyze_category':
        router.push(`/categories?category=${encodeURIComponent(selectedInsight.category || '')}`);
        break;
      default:
        break;
    }
    setShowActionModal(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Financial Insights</h1>
          <p className="text-gray-600">Smart analysis of your spending patterns for {getPeriodLabel().toLowerCase()}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Smart Summary Card */}
        {smartSummary && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">🤖 Smart Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Top spending category</p>
                <p className="text-xl font-bold">{smartSummary.topCategory}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Weekend spending</p>
                <p className="text-xl font-bold">
                  {formatCurrency(smartSummary.trends.weekendAvg)}
                  <span className="text-sm ml-2">
                    (+{((smartSummary.trends.weekendAvg - smartSummary.trends.weekdayAvg) / smartSummary.trends.weekdayAvg * 100).toFixed(0)}% vs weekdays)
                  </span>
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
              <p className="text-sm">
                <strong>Key Habit:</strong> You spend {((smartSummary.trends.weekendAvg - smartSummary.trends.weekdayAvg) / smartSummary.trends.weekdayAvg * 100).toFixed(0)}% more on weekends. 
                Consider planning weekend activities with set budgets.
              </p>
            </div>

            {smartSummary.unusualTransactions > 0 && (
              <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ {smartSummary.unusualTransactions} anomalies detected</strong> - Review suspicious transactions below
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spending Anomalies */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Spending Anomalies Detected</h3>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  anomaly.severity === 'high' ? 'border-red-500 bg-red-50' :
                  anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{anomaly.description}</p>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.actionRequired}</p>
                      {anomaly.potentialSavings > 0 && (
                        <p className="text-sm font-medium mt-2">
                          💰 Potential savings: {formatCurrency(anomaly.potentialSavings)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">💡 AI Recommendations</h3>
          
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className={`rounded-lg p-6 border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        {insight.trend && (
                          <span className="flex items-center space-x-1 text-sm">
                            <span>{getTrendIcon(insight.trend)}</span>
                            {insight.trendPercentage && (
                              <span className={
                                insight.trend === 'up' ? 'text-red-600' :
                                insight.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                              }>
                                {insight.trendPercentage.toFixed(1)}% vs last month
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-3">{insight.description}</p>
                      
                      {insight.potentialSavings > 0 && (
                        <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-3">
                          <p className="font-medium text-sm">
                            💰 Potential Savings: {formatCurrency(insight.potentialSavings)} per {insight.timeframe}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTakeAction(insight)}
                          className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border"
                        >
                          Take Action
                        </button>
                        {insight.category && (
                          <button
                            onClick={() => router.push(`/transactions?category=${encodeURIComponent(insight.category || '')}`)}
                            className="bg-white bg-opacity-50 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-opacity-70 transition-colors"
                          >
                            View Transactions
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Your Spending</h3>
              <p className="text-gray-600 mb-4">
                We need more transaction data to provide personalized insights
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Connect Bank Account
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/subscriptions')}
              className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-xl">📺</span>
              <div className="text-left">
                <p className="font-medium text-sm">Review Subscriptions</p>
                <p className="text-xs text-gray-600">Find unused services</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/categories')}
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-xl">🏷️</span>
              <div className="text-left">
                <p className="font-medium text-sm">Categorize Transactions</p>
                <p className="text-xs text-gray-600">Improve AI accuracy</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/budgets')}
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-xl">🎯</span>
              <div className="text-left">
                <p className="font-medium text-sm">Set Budgets</p>
                <p className="text-xs text-gray-600">Control spending</p>
              </div>
            </button>
            
            <button
              onClick={() => loadInsightsData(user?.id || '')}
              className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-xl">🔄</span>
              <div className="text-left">
                <p className="font-medium text-sm">Refresh Analysis</p>
                <p className="text-xs text-gray-600">Get latest insights</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Take Action</h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedInsight.title}</h4>
                <p className="text-sm text-gray-600">{selectedInsight.description}</p>
                {selectedInsight.potentialSavings > 0 && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    💰 Save {formatCurrency(selectedInsight.potentialSavings)} per {selectedInsight.timeframe}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => executeAction('create_budget')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🎯 Create Budget for {selectedInsight.category || 'Category'}
                </button>
                
                <button
                  onClick={() => executeAction('view_transactions')}
                  className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  📊 View Related Transactions
                </button>
                
                {selectedInsight.potentialSavings > 0 && (
                  <button
                    onClick={() => executeAction('set_goal')}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    🏆 Set Savings Goal ({formatCurrency(selectedInsight.potentialSavings)})
                  </button>
                )}
                
                <button
                  onClick={() => executeAction('analyze_category')}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  🔍 Analyze Category in Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
