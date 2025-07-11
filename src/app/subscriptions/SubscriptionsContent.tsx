'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  auto_detected: boolean;
  cancellation_url?: string;
  notes?: string;
  created_at: string;
  last_charged?: string;
  provider?: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  user_category?: string;
}

interface SubscriptionAnalytics {
  totalMonthlyAmount: number;
  totalYearlyAmount: number;
  averagePerSubscription: number;
  mostExpensive: Subscription | null;
  upcomingCharges: Array<{
    subscription: Subscription;
    daysUntil: number;
    amount: number;
  }>;
  categoryBreakdown: Record<string, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  savingsOpportunities: Array<{
    type: 'duplicate' | 'underused' | 'expensive';
    message: string;
    potentialSavings: number;
    subscriptions: string[];
  }>;
}

export default function SubscriptionsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<Subscription[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'detected' | 'cancelled'>('active');
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    description: '',
    amount: '',
    billingCycle: 'monthly' as Subscription['billing_cycle'],
    nextBillingDate: '',
    category: 'Subscriptions',
    cancellationUrl: '',
    notes: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPeriodLabel } = useTimePeriod();

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
      setShowCreateModal(true);
    }
  }, [router, shouldOpenAddModal]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load subscriptions and detected subscriptions
      const [subscriptionsRes, detectedRes] = await Promise.all([
        fetch(`/api/subscriptions?userId=${userId}`),
        fetch(`/api/subscriptions/detect?userId=${userId}`)
      ]);

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        if (subscriptionsData.success) {
          setSubscriptions(subscriptionsData.subscriptions || []);
          calculateAnalytics(subscriptionsData.subscriptions || []);
        }
      }

      if (detectedRes.ok) {
        const detectedData = await detectedRes.json();
        if (detectedData.success) {
          setDetectedSubscriptions(detectedData.detected || []);
        }
      }

    } catch (error) {
      console.error('Error loading subscriptions data:', error);
      setError('Failed to load subscriptions data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (subs: Subscription[]) => {
    const activeSubs = subs.filter(s => s.status === 'active');
    
    // Calculate monthly amounts
    const monthlyAmounts = activeSubs.map(sub => {
      switch (sub.billing_cycle) {
        case 'weekly': return sub.amount * 4.33; // Average weeks per month
        case 'monthly': return sub.amount;
        case 'quarterly': return sub.amount / 3;
        case 'yearly': return sub.amount / 12;
        default: return sub.amount;
      }
    });

    const totalMonthlyAmount = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    const totalYearlyAmount = totalMonthlyAmount * 12;
    const averagePerSubscription = activeSubs.length > 0 ? totalMonthlyAmount / activeSubs.length : 0;

    // Find most expensive
    const mostExpensive = activeSubs.reduce((max, sub) => {
      const monthlyAmount = monthlyAmounts[activeSubs.indexOf(sub)];
      const maxMonthlyAmount = max ? monthlyAmounts[activeSubs.indexOf(max)] : 0;
      return monthlyAmount > maxMonthlyAmount ? sub : max;
    }, null as Subscription | null);

    // Calculate upcoming charges (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const upcomingCharges = activeSubs
      .map(sub => {
        const nextBilling = new Date(sub.next_billing_date);
        const daysUntil = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          subscription: sub,
          daysUntil,
          amount: sub.amount
        };
      })
      .filter(charge => charge.daysUntil >= 0 && charge.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // Category breakdown
    const categoryBreakdown: Record<string, { amount: number; count: number; percentage: number }> = {};
    activeSubs.forEach((sub, index) => {
      const monthlyAmount = monthlyAmounts[index];
      if (!categoryBreakdown[sub.category]) {
        categoryBreakdown[sub.category] = { amount: 0, count: 0, percentage: 0 };
      }
      categoryBreakdown[sub.category].amount += monthlyAmount;
      categoryBreakdown[sub.category].count += 1;
    });

    // Calculate percentages
    Object.keys(categoryBreakdown).forEach(category => {
      categoryBreakdown[category].percentage = totalMonthlyAmount > 0 
        ? (categoryBreakdown[category].amount / totalMonthlyAmount) * 100 
        : 0;
    });

    // Savings opportunities
    const savingsOpportunities: SubscriptionAnalytics['savingsOpportunities'] = [];

    // Find duplicate categories
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.count > 1 && category !== 'Subscriptions') {
        const categorySum = data.amount;
        const potentialSavings = categorySum * 0.3; // Assume 30% savings from consolidation
        savingsOpportunities.push({
          type: 'duplicate',
          message: `You have ${data.count} subscriptions in ${category}. Consider consolidating.`,
          potentialSavings,
          subscriptions: activeSubs.filter(s => s.category === category).map(s => s.name)
        });
      }
    });

    // Find expensive subscriptions
    activeSubs.forEach((sub, index) => {
      const monthlyAmount = monthlyAmounts[index];
      if (monthlyAmount > averagePerSubscription * 2) {
        savingsOpportunities.push({
          type: 'expensive',
          message: `${sub.name} costs ${formatCurrency(monthlyAmount)}/month. Consider if you're getting full value.`,
          potentialSavings: monthlyAmount * 0.5, // Potential to reduce by 50%
          subscriptions: [sub.name]
        });
      }
    });

    setAnalytics({
      totalMonthlyAmount,
      totalYearlyAmount,
      averagePerSubscription,
      mostExpensive,
      upcomingCharges,
      categoryBreakdown,
      savingsOpportunities
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'yearly': 'Yearly'
    };
    return labels[cycle] || cycle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubscriptionIcon = (name: string, category: string) => {
    const nameIcons: Record<string, string> = {
      'spotify': '🎵',
      'netflix': '🎬',
      'disney': '🏰',
      'hbo': '📺',
      'apple': '🍎',
      'google': '🔍',
      'microsoft': '💻',
      'amazon': '📦',
      'youtube': '📹',
      'twitch': '🎮',
      'dropbox': '☁️',
      'github': '👨‍💻',
      'notion': '📝',
      'slack': '💬',
      'zoom': '📞',
      'canva': '🎨',
      'adobe': '🎨',
      'gym': '💪',
      'fitness': '🏃‍♂️',
      'transport': '🚌',
      'news': '📰',
      'magazine': '📖'
    };

    const categoryIcons: Record<string, string> = {
      'Entertainment': '🎬',
      'Productivity': '💻',
      'News': '📰',
      'Fitness': '💪',
      'Music': '🎵',
      'Gaming': '🎮',
      'Cloud Storage': '☁️',
      'Communication': '💬',
      'Design': '🎨',
      'Transport': '🚌',
      'Education': '📚',
      'Finance': '💰',
      'Health': '🏥',
      'Subscriptions': '📋'
    };

    // Try to match by name first
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(nameIcons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }

    // Fall back to category
    return categoryIcons[category] || '📋';
  };

  const getDaysUntilNextBilling = (nextBillingDate: string) => {
    const next = new Date(nextBillingDate);
    const now = new Date();
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleCreateSubscription = async () => {
    if (!user || !newSubscription.name || !newSubscription.amount || !newSubscription.nextBillingDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'create',
          subscription: {
            name: newSubscription.name,
            description: newSubscription.description || null,
            amount: parseFloat(newSubscription.amount),
            billingCycle: newSubscription.billingCycle,
            nextBillingDate: newSubscription.nextBillingDate,
            category: newSubscription.category,
            cancellationUrl: newSubscription.cancellationUrl || null,
            notes: newSubscription.notes || null
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setNewSubscription({
          name: '',
          description: '',
          amount: '',
          billingCycle: 'monthly',
          nextBillingDate: '',
          category: 'Subscriptions',
          cancellationUrl: '',
          notes: ''
        });
        setShowCreateModal(false);
        alert('Subscription added successfully!');
      } else {
        alert(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription');
    }
  };

  const handleUpdateSubscription = async () => {
    if (!user || !editingSubscription) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: editingSubscription.id,
          subscription: editingSubscription
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        setEditingSubscription(null);
        setShowEditModal(false);
        alert('Subscription updated successfully!');
      } else {
        alert(data.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions?userId=${user.id}&subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert('Subscription deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete subscription');
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Failed to delete subscription');
    }
  };

  const handleToggleSubscriptionStatus = async (subscription: Subscription, newStatus: Subscription['status']) => {
    if (!user) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: subscription.id,
          subscription: {
            ...subscription,
            status: newStatus
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
      } else {
        alert(data.error || 'Failed to update subscription status');
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
      alert('Failed to update subscription status');
    }
  };

  const handleConfirmDetectedSubscription = async (detectedSub: Subscription) => {
    if (!user) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'confirm_detected',
          subscription: detectedSub
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadData(user.id);
        alert('Subscription confirmed and added!');
      } else {
        alert(data.error || 'Failed to confirm subscription');
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      alert('Failed to confirm subscription');
    }
  };

  const getActiveSubscriptions = () => subscriptions.filter(s => s.status === 'active');
  const getCancelledSubscriptions = () => subscriptions.filter(s => s.status === 'cancelled');

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
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-600">Manage your recurring subscriptions and memberships</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Subscription
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Analytics Overview */}
        {analytics && getActiveSubscriptions().length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Overview</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.totalMonthlyAmount)}
                </p>
                <p className="text-sm text-gray-600">Monthly Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analytics.totalYearlyAmount)}
                </p>
                <p className="text-sm text-gray-600">Yearly Total</p>
              </div>
            </div>

            {/* Upcoming Charges */}
            {analytics.upcomingCharges.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Upcoming Charges (Next 30 Days)</h4>
                <div className="space-y-2">
                  {analytics.upcomingCharges.slice(0, 3).map((charge, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSubscriptionIcon(charge.subscription.name, charge.subscription.category)}</span>
                        <span className="font-medium text-gray-900">{charge.subscription.name}</span>
                        <span className="text-sm text-gray-500">
                          in {charge.daysUntil} day{charge.daysUntil !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings Opportunities */}
            {analytics.savingsOpportunities.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Savings Opportunities</h4>
                <div className="space-y-2">
                  {analytics.savingsOpportunities.slice(0, 2).map((opportunity, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm font-medium">
                        💡 {opportunity.message}
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Potential savings: {formatCurrency(opportunity.potentialSavings)}/month
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({getActiveSubscriptions().length})
            </button>
            <button
              onClick={() => setActiveTab('detected')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'detected'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Detected ({detectedSubscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'cancelled'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cancelled ({getCancelledSubscriptions().length})
            </button>
          </div>

          <div className="p-6">
            {/* Active Subscriptions */}
            {activeTab === 'active' && (
              <div className="space-y-4">
                {getActiveSubscriptions().length > 0 ? (
                  getActiveSubscriptions().map((subscription) => {
                    const daysUntilBilling = getDaysUntilNextBilling(subscription.next_billing_date);
                    
                    return (
                      <div key={subscription.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                              <span className="text-xl">{getSubscriptionIcon(subscription.name, subscription.category)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">{subscription.category}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(subscription.status)}`}>
                                  {subscription.status}
                                </span>
                                {subscription.auto_detected && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                    Auto-detected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingSubscription(subscription);
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleSubscriptionStatus(subscription, 'paused')}
                              className="text-yellow-600 hover:text-yellow-800 text-sm"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => handleToggleSubscriptionStatus(subscription, 'cancelled')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        {subscription.description && (
                          <p className="text-gray-600 text-sm mb-3">{subscription.description}</p>
                        )}

                        {/* Subscription Details */}
                        <div className="grid grid-cols-4 gap-4 text-center mb-3">
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(subscription.amount)}
                            </p>
                            <p className="text-xs text-gray-500">{getBillingCycleLabel(subscription.billing_cycle)}</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {daysUntilBilling}
                            </p>
                            <p className="text-xs text-gray-500">Days Until Billing</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {new Date(subscription.next_billing_date).toLocaleDateString('da-DK')}
                            </p>
                            <p className="text-xs text-gray-500">Next Billing</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {subscription.last_charged 
                                ? new Date(subscription.last_charged).toLocaleDateString('da-DK')
                                : 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">Last Charged</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {subscription.cancellation_url && (
                            <a
                              href={subscription.cancellation_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                            >
                              Cancel Online
                            </a>
                          )}
                          <button
                            onClick={() => router.push(`/transactions?search=${encodeURIComponent(subscription.name)}`)}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                          >
                            View Transactions
                          </button>
                          <button
                            onClick={() => router.push(`/budgets?add=true&category=${encodeURIComponent(subscription.category)}`)}
                            className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200"
                          >
                            Create Budget
                          </button>
                        </div>

                        {subscription.notes && (
                          <div className="mt-3 p-2 bg-white rounded border">
                            <p className="text-xs text-gray-600">
                              <strong>Notes:</strong> {subscription.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscriptions</h3>
                    <p className="text-gray-600 mb-4">
                      Add your subscriptions to track spending and get optimization tips
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Subscription
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Detected Subscriptions */}
            {activeTab === 'detected' && (
              <div className="space-y-4">
                {detectedSubscriptions.length > 0 ? (
                  detectedSubscriptions.map((detectedSub) => (
                    <div key={detectedSub.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-xl">{getSubscriptionIcon(detectedSub.name, detectedSub.category)}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{detectedSub.name}</h3>
                            <p className="text-sm text-gray-600">
                              Detected from transactions • {formatCurrency(detectedSub.amount)} {getBillingCycleLabel(detectedSub.billing_cycle)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleConfirmDetectedSubscription(detectedSub)}
                            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDetectedSubscriptions(prev => prev.filter(s => s.id !== detectedSub.id))}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <p className="text-blue-800 text-sm">
                        💡 We detected this recurring charge. Confirm to add it to your subscriptions.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Detected Subscriptions</h3>
                    <p className="text-gray-600">
                      We'll automatically scan your transactions for recurring payments and show them here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Subscriptions */}
            {activeTab === 'cancelled' && (
              <div className="space-y-4">
                {getCancelledSubscriptions().length > 0 ? (
                  getCancelledSubscriptions().map((subscription) => (
                    <div key={subscription.id} className="bg-gray-50 rounded-lg p-4 opacity-60">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-xl">{getSubscriptionIcon(subscription.name, subscription.category)}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{subscription.category}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(subscription.status)}`}>
                                {subscription.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleSubscriptionStatus(subscription, 'active')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Reactivate
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {formatCurrency(subscription.amount)} {getBillingCycleLabel(subscription.billing_cycle)} • 
                        Cancelled subscription
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🗑️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancelled Subscriptions</h3>
                    <p className="text-gray-600">
                      Cancelled subscriptions will appear here for reference
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New Subscription</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Netflix, Spotify, Gym Membership"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSubscription.amount}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="99.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={newSubscription.billingCycle}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, billingCycle: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Billing Date
                </label>
                <input
                  type="date"
                  value={newSubscription.nextBillingDate}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newSubscription.category}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Productivity">Productivity</option>
                  <option value="News">News</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Cloud Storage">Cloud Storage</option>
                  <option value="Communication">Communication</option>
                  <option value="Design">Design</option>
                  <option value="Transport">Transport</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation URL (Optional)
                </label>
                <input
                  type="url"
                  value={newSubscription.cancellationUrl}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, cancellationUrl: e.target.value }))}
                  placeholder="https://example.com/cancel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Link to cancel this subscription</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newSubscription.description}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes about this subscription..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newSubscription.notes}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reminders, thoughts, or other notes..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={!newSubscription.name || !newSubscription.amount || !newSubscription.nextBillingDate}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Add Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && editingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Subscription</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={editingSubscription.name}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (DKK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingSubscription.amount}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={editingSubscription.billing_cycle}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, billing_cycle: e.target.value as any } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Billing Date
                </label>
                <input
                  type="date"
                  value={editingSubscription.next_billing_date}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, next_billing_date: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editingSubscription.category}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Productivity">Productivity</option>
                  <option value="News">News</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Cloud Storage">Cloud Storage</option>
                  <option value="Communication">Communication</option>
                  <option value="Design">Design</option>
                  <option value="Transport">Transport</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingSubscription.status}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation URL (Optional)
                </label>
                <input
                  type="url"
                  value={editingSubscription.cancellation_url || ''}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, cancellation_url: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editingSubscription.description || ''}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={editingSubscription.notes || ''}
                  onChange={(e) => setEditingSubscription(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubscription}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Update Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
