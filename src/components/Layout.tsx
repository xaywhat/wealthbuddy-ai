'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'mission' | 'achievement';
  read: boolean;
  created_at: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loadingFinancialSummary, setLoadingFinancialSummary] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { 
    selectedPeriod, 
    customStartDate, 
    customEndDate, 
    setSelectedPeriod, 
    setCustomStartDate, 
    setCustomEndDate, 
    getPeriodLabel 
  } = useTimePeriod();

  useEffect(() => {
    const userData = localStorage.getItem('wealthbuddy_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadNotifications(parsedUser.id);
      checkConnectionStatus(parsedUser.id);
      loadFinancialSummary(parsedUser.id);
    }
  }, []);

  // Reload financial summary when time period changes
  useEffect(() => {
    if (user && isConnected) {
      loadFinancialSummary(user.id);
    }
  }, [selectedPeriod, customStartDate, customEndDate, user, isConnected]);

  const loadNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkConnectionStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/data/accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.success && data.accounts.length > 0);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const loadFinancialSummary = async (userId: string) => {
    try {
      setLoadingFinancialSummary(true);
      const response = await fetch(`/api/financial-summary?userId=${userId}&period=${selectedPeriod}&startDate=${customStartDate}&endDate=${customEndDate}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFinancialSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
    } finally {
      setLoadingFinancialSummary(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wealthbuddy_user');
    router.push('/login');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          action: 'mark_read'
        }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Home';
      case '/dashboard': return 'Dashboard';
      case '/categories': return 'Categories';
      case '/transactions': return 'Transactions';
      case '/budgets': return 'Budgets';
      case '/goals': return 'Goals';
      case '/subscriptions': return 'Subscriptions';
      case '/achievements': return 'Achievements';
      case '/insights': return 'AI Insights';
      case '/profile': return 'Profile';
      default: return 'WealthBuddy';
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setShowTimePeriodDropdown(false);
  };

  // Only show financial summary and time selector on main app pages, not on login
  const shouldShowFinancialSummary = user && isConnected && pathname !== '/login' && pathname !== '/privacy-policy' && pathname !== '/terms-of-service';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">WealthBuddy</h1>
            </Link>
            <span className="text-sm text-gray-500">• {getPageTitle()}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Period Selector - Only show if user is connected */}
            {shouldShowFinancialSummary && (
              <div className="relative">
                <button
                  onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                  className="flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <span>{getPeriodLabel()}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Time Period Dropdown */}
                {showTimePeriodDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => handlePeriodChange('this_week')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => handlePeriodChange('last_week')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last Week
                    </button>
                    <button
                      onClick={() => handlePeriodChange('this_month')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => handlePeriodChange('last_month')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last Month
                    </button>
                    <button
                      onClick={() => handlePeriodChange('last_3_months')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 3 Months
                    </button>
                    <button
                      onClick={() => handlePeriodChange('last_6_months')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 6 Months
                    </button>
                    <button
                      onClick={() => handlePeriodChange('this_year')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Year
                    </button>
                    <button
                      onClick={() => handlePeriodChange('last_year')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last Year
                    </button>
                    <button
                      onClick={() => handlePeriodChange('all')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      All Time
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => handlePeriodChange('custom')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Custom Range
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg hover:bg-blue-700 transition-colors"
              >
                +
              </button>
              
              {/* Add Menu Dropdown */}
              {showAddMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/transactions?add=true"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowAddMenu(false)}
                  >
                    📝 Add Transaction
                  </Link>
                  <Link
                    href="/budgets?add=true"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowAddMenu(false)}
                  >
                    🎯 Create Budget
                  </Link>
                  <Link
                    href="/goals?add=true"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowAddMenu(false)}
                  >
                    🏆 Set Goal
                  </Link>
                  <Link
                    href="/categories?add=true"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowAddMenu(false)}
                  >
                    📊 Add Category
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center relative hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="py-1">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">
                              {notification.type === 'achievement' ? '🏆' : 
                               notification.type === 'mission' ? '🎯' : 
                               notification.type === 'warning' ? '⚠️' : 
                               notification.type === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString('da-DK')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <span className="text-lg">📭</span>
                      <p className="text-sm mt-2">No notifications</p>
                    </div>
                  )}
                  
                  {notifications.length > 10 && (
                    <div className="p-3 border-t border-gray-200">
                      <Link
                        href="/notifications"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Button */}
            {user ? (
              <Link
                href="/profile"
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                {user.keyphrase?.charAt(0).toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Financial Summary Bar */}
        {shouldShowFinancialSummary && (
          <div className="mt-3">
            {loadingFinancialSummary ? (
              <div className="flex items-center justify-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div className="animate-pulse flex space-x-4 w-full">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ) : financialSummary ? (
              <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-600">📈</span>
                    <span className="text-gray-600">Income:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(financialSummary.totalIncome)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-600">📉</span>
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(Math.abs(financialSummary.totalExpenses))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Net:</span>
                  <span className={`font-bold ${financialSummary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(financialSummary.netAmount)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Custom Date Range Input */}
        {shouldShowFinancialSummary && selectedPeriod === 'custom' && (
          <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex space-x-3 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
        <div className="flex justify-around items-center">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link
            href="/budgets"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              pathname === '/budgets' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">🎯</span>
            <span className="text-xs font-medium">Budgets</span>
          </Link>

          <Link
            href="/categories"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              pathname === '/categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-xs font-medium">Categories</span>
          </Link>

          <Link
            href="/transactions"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              pathname === '/transactions' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">💳</span>
            <span className="text-xs font-medium">Transactions</span>
          </Link>

          <Link
            href="/goals"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
              pathname === '/goals' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl">🏆</span>
            <span className="text-xs font-medium">Goals</span>
          </Link>
        </div>
      </nav>

      {/* Click outside handlers */}
      {(showNotifications || showAddMenu || showTimePeriodDropdown) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowAddMenu(false);
            setShowTimePeriodDropdown(false);
          }}
        />
      )}
    </div>
  );
}
