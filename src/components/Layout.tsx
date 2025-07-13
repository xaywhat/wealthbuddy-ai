'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { 
  Bell, 
  Plus, 
  Home, 
  Target, 
  Trophy, 
  BarChart3, 
  CreditCard, 
  User, 
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'mission': return '🎯';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  // Only show financial summary and time selector on main app pages, not on login
  const shouldShowFinancialSummary = user && isConnected && pathname !== '/login' && pathname !== '/privacy-policy' && pathname !== '/terms-of-service';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="glass-card-dark sticky top-0 z-40 border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">WealthBuddy</h1>
                  <p className="text-xs text-gray-400">{getPageTitle()}</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Period Selector - Only show if user is connected */}
              {shouldShowFinancialSummary && (
                <div className="relative">
                  <button
                    onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                    className="flex items-center space-x-2 glass-card px-4 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{getPeriodLabel()}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Time Period Dropdown */}
                  {showTimePeriodDropdown && (
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-xl border border-white/10 py-2 z-50">
                      {[
                        { key: 'this_week', label: 'This Week' },
                        { key: 'last_week', label: 'Last Week' },
                        { key: 'this_month', label: 'This Month' },
                        { key: 'last_month', label: 'Last Month' },
                        { key: 'last_3_months', label: 'Last 3 Months' },
                        { key: 'last_6_months', label: 'Last 6 Months' },
                        { key: 'this_year', label: 'This Year' },
                        { key: 'last_year', label: 'Last Year' },
                        { key: 'all', label: 'All Time' },
                        { key: 'custom', label: 'Custom Range' }
                      ].map((period) => (
                        <button
                          key={period.key}
                          onClick={() => handlePeriodChange(period.key)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                            selectedPeriod === period.key ? 'bg-white/10 text-blue-400' : 'text-white'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                </button>
                
                {/* Add Menu Dropdown */}
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-xl border border-white/10 py-2 z-50">
                    <Link
                      href="/transactions?add=true"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Add Transaction</span>
                    </Link>
                    <Link
                      href="/budgets?add=true"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <Target className="w-4 h-4" />
                      <span>Create Budget</span>
                    </Link>
                    <Link
                      href="/goals?add=true"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Set Goal</span>
                    </Link>
                    <Link
                      href="/categories?add=true"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Add Category</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-xl border border-white/10 max-h-96 overflow-y-auto z-50">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className="py-2">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-500/10' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
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
                      <div className="p-6 text-center text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                    
                    {notifications.length > 10 && (
                      <div className="p-4 border-t border-white/10">
                        <Link
                          href="/notifications"
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {user.keyphrase?.charAt(0).toUpperCase() || 'U'}
                  </button>

                  {/* Profile Menu Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-xl border border-white/10 py-2 z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user.keyphrase}</p>
                        <p className="text-xs text-gray-400">Premium User</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>App Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary text-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Financial Summary Bar */}
          {shouldShowFinancialSummary && (
            <div className="mt-4">
              {loadingFinancialSummary ? (
                <div className="glass-card rounded-xl px-4 py-3">
                  <div className="flex items-center justify-center">
                    <div className="loading-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-sm text-gray-400">Loading financial data...</span>
                  </div>
                </div>
              ) : financialSummary ? (
                <div className="glass-card rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Income</p>
                          <p className="text-sm font-semibold text-green-400">
                            {formatCurrency(financialSummary.totalIncome)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Expenses</p>
                          <p className="text-sm font-semibold text-red-400">
                            {formatCurrency(Math.abs(financialSummary.totalExpenses))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        financialSummary.netAmount >= 0 ? 'bg-blue-500/20' : 'bg-red-500/20'
                      }`}>
                        <DollarSign className={`w-4 h-4 ${
                          financialSummary.netAmount >= 0 ? 'text-blue-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Net Amount</p>
                        <p className={`text-sm font-bold ${
                          financialSummary.netAmount >= 0 ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(financialSummary.netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Custom Date Range Input */}
          {shouldShowFinancialSummary && selectedPeriod === 'custom' && (
            <div className="mt-3 glass-card rounded-xl px-4 py-3">
              <div className="flex space-x-4 items-center">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-2">From Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="modern-input w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-2">To Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="modern-input w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card-dark border-t border-white/10 px-4 py-3 z-30">
        <div className="flex justify-around items-center">
          <Link
            href="/budgets"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              pathname === '/budgets' 
                ? 'bg-blue-500/20 text-blue-400 shadow-glow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-xs font-medium">Budgets</span>
          </Link>

          <Link
            href="/goals"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              pathname === '/goals' 
                ? 'bg-blue-500/20 text-blue-400 shadow-glow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-medium">Goals</span>
          </Link>

          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              pathname === '/' 
                ? 'bg-blue-500/20 text-blue-400 shadow-glow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/categories"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              pathname === '/categories' 
                ? 'bg-blue-500/20 text-blue-400 shadow-glow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Categories</span>
          </Link>

          <Link
            href="/transactions"
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              pathname === '/transactions' 
                ? 'bg-blue-500/20 text-blue-400 shadow-glow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Transactions</span>
          </Link>
        </div>
      </nav>

      {/* Click outside handlers */}
      {(showNotifications || showAddMenu || showTimePeriodDropdown || showProfileMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowAddMenu(false);
            setShowTimePeriodDropdown(false);
            setShowProfileMenu(false);
          }}
        />
      )}
    </div>
  );
}
