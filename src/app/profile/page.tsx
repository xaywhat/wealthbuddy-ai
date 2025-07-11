'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface UserPreferences {
  id: string;
  user_id: string;
  notification_frequency: 'daily' | 'weekly' | 'monthly';
  budget_alerts_enabled: boolean;
  goal_reminders_enabled: boolean;
  achievement_notifications: boolean;
  weekly_summary_email: boolean;
  privacy_level: 'minimal' | 'standard' | 'full';
  preferred_currency: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalTransactions: number;
  totalAccounts: number;
  activeBudgets: number;
  completedGoals: number;
  achievementsEarned: number;
  totalPoints: number;
  memberSince: string;
  lastSync: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'stats' | 'data'>('profile');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('wealthbuddy_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadProfileData(parsedUser.id);
  }, [router]);

  const loadProfileData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load user preferences and stats
      const [preferencesRes, statsRes] = await Promise.all([
        fetch(`/api/profile/preferences?userId=${userId}`),
        fetch(`/api/profile/stats?userId=${userId}`)
      ]);

      if (preferencesRes.ok) {
        const preferencesData = await preferencesRes.json();
        if (preferencesData.success) {
          setPreferences(preferencesData.preferences);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          preferences: updatedPreferences
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.preferences);
          setSuccessMessage('Preferences saved successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(data.error || 'Failed to save preferences');
        }
      } else {
        setError('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wealthbuddy_user');
    router.push('/login');
  };

  const exportData = async (format: 'csv' | 'json') => {
    if (!user) return;

    try {
      const response = await fetch('/api/profile/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          format
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wealthbuddy_data_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.keyphrase?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.keyphrase}</h1>
              <p className="text-gray-600">
                Member since {new Date(user?.created_at || '').toLocaleDateString('da-DK')}
              </p>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-sm font-medium ${
                activeTab === 'profile' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 py-4 px-6 text-sm font-medium ${
                activeTab === 'preferences' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-4 px-6 text-sm font-medium ${
                activeTab === 'stats' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-4 px-6 text-sm font-medium ${
                activeTab === 'data' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Data
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">User ID</span>
                    <span className="font-medium text-gray-900">{user?.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Username</span>
                    <span className="font-medium text-gray-900">{user?.keyphrase}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium text-gray-900">
                      {new Date(user?.created_at || '').toLocaleDateString('da-DK')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && preferences && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Budget Alerts</p>
                      <p className="text-sm text-gray-600">Get notified when you're close to budget limits</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.budget_alerts_enabled}
                        onChange={(e) => savePreferences({ budget_alerts_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Goal Reminders</p>
                      <p className="text-sm text-gray-600">Get reminded about your financial goals</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.goal_reminders_enabled}
                        onChange={(e) => savePreferences({ goal_reminders_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Achievement Notifications</p>
                      <p className="text-sm text-gray-600">Celebrate when you unlock achievements</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.achievement_notifications}
                        onChange={(e) => savePreferences({ achievement_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Summary Email</p>
                      <p className="text-sm text-gray-600">Receive weekly financial summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.weekly_summary_email}
                        onChange={(e) => savePreferences({ weekly_summary_email: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Frequency
                    </label>
                    <select
                      value={preferences.notification_frequency}
                      onChange={(e) => savePreferences({ notification_frequency: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Level
                    </label>
                    <select
                      value={preferences.privacy_level}
                      onChange={(e) => savePreferences({ privacy_level: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="standard">Standard</option>
                      <option value="full">Full</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => savePreferences({ language: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                    >
                      <option value="da-DK">Danish</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your WealthBuddy Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.totalAccounts}</div>
                    <div className="text-sm text-gray-600">Connected Accounts</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.activeBudgets}</div>
                    <div className="text-sm text-gray-600">Active Budgets</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.completedGoals}</div>
                    <div className="text-sm text-gray-600">Completed Goals</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{stats.achievementsEarned}</div>
                    <div className="text-sm text-gray-600">Achievements Earned</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-indigo-600">{stats.totalPoints}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Last Sync</span>
                    <span className="font-medium text-gray-900">
                      {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString('da-DK') : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium text-gray-900">
                      {new Date(stats.memberSince).toLocaleDateString('da-DK')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Your Data</h3>
                <p className="text-gray-600 mb-4">
                  Download your financial data in various formats for backup or analysis.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => exportData('csv')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Privacy</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Your data is stored securely and encrypted. We never share your financial information with third parties. 
                    You have full control over your data and can export or delete it at any time.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Account</h3>
                <p className="text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // Handle account deletion
                      alert('Account deletion feature coming soon');
                    }
                  }}
                  className="bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
