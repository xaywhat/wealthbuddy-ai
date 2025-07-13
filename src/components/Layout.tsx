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
  Settings,
  LogOut,
  Wallet,
  Menu,
  X
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

  // Only show financial summary and time selector on main app pages, not on login
  const shouldShowFinancialSummary = user && isConnected && pathname !== '/login' && pathname !== '/privacy-policy' && pathname !== '/terms-of-service';

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left side - Logo and title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                backgroundColor: 'var(--accent-blue)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={18} color="white" />
              </div>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: 'var(--text-primary)' 
              }}>
                WealthBuddy
              </span>
            </Link>
            
            {/* Page title */}
            <span style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              paddingLeft: '16px',
              borderLeft: '1px solid var(--border-color)'
            }}>
              {getPageTitle()}
            </span>
          </div>
          
          {/* Right side - Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Financial Summary */}
            {shouldShowFinancialSummary && financialSummary && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Income:</span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: 'var(--accent-green)' 
                  }}>
                    {formatCurrency(financialSummary.totalIncome)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Expenses:</span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: 'var(--accent-red)' 
                  }}>
                    {formatCurrency(Math.abs(financialSummary.totalExpenses))}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  paddingLeft: '12px',
                  borderLeft: '1px solid var(--border-color)'
                }}>
                  <span>Net Amount:</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: financialSummary.netAmount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}>
                    {formatCurrency(financialSummary.netAmount)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Time Period Selector */}
            {shouldShowFinancialSummary && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  {getPeriodLabel()}
                  <ChevronDown size={14} />
                </button>

                {showTimePeriodDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}>
                    {[
                      { key: 'this_week', label: 'This Week' },
                      { key: 'last_week', label: 'Last Week' },
                      { key: 'this_month', label: 'This Month' },
                      { key: 'last_month', label: 'Last Month' },
                      { key: 'last_3_months', label: 'Last 3 Months' },
                      { key: 'this_year', label: 'This Year' },
                      { key: 'all', label: 'All Time' },
                      { key: 'custom', label: 'Custom Range' }
                    ].map((period) => (
                      <button
                        key={period.key}
                        onClick={() => handlePeriodChange(period.key)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: '14px',
                          backgroundColor: selectedPeriod === period.key ? 'var(--accent-blue)' : 'transparent',
                          color: selectedPeriod === period.key ? 'white' : 'var(--text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPeriod !== period.key) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPeriod !== period.key) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="btn btn-primary"
              >
                <Plus size={16} />
              </button>
              
              {showAddMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  width: '180px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  zIndex: 50,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}>
                  <Link
                    href="/budgets?add=true"
                    onClick={() => setShowAddMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Target size={16} />
                    Create Budget
                  </Link>
                  <Link
                    href="/goals?add=true"
                    onClick={() => setShowAddMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trophy size={16} />
                    Set Goal
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-secondary"
                style={{ position: 'relative' }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--accent-red)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 50,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ 
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Notifications
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            backgroundColor: !notification.read ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = !notification.read ? 'rgba(74, 158, 255, 0.1)' : 'transparent';
                          }}
                        >
                          <div style={{ 
                            fontWeight: '500', 
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            marginBottom: '4px'
                          }}>
                            {notification.title}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                          }}>
                            {notification.message}
                          </div>
                          <div style={{ 
                            fontSize: '10px',
                            color: 'var(--text-muted)'
                          }}>
                            {new Date(notification.created_at).toLocaleDateString('da-DK')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '14px'
                    }}>
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--accent-blue)',
                    borderRadius: '8px',
                    border: 'none',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {user.keyphrase?.charAt(0).toUpperCase() || 'U'}
                </button>

                {showProfileMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '180px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ 
                      padding: '12px',
                      borderBottom: '1px solid var(--border-color)',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        fontWeight: '500',
                        fontSize: '14px',
                        color: 'var(--text-primary)'
                      }}>
                        {user.keyphrase}
                      </div>
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}>
                        Premium User
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: 'var(--accent-red)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Custom Date Range Input */}
        {shouldShowFinancialSummary && selectedPeriod === 'custom' && (
          <div style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                From Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                To Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ paddingBottom: '80px' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        padding: '12px 20px',
        zIndex: 30
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center' 
        }}>
          <Link
            href="/budgets"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === '/budgets' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/budgets' ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
            }}
          >
            <Target size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Budgets</span>
          </Link>

          <Link
            href="/goals"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === '/goals' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/goals' ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
            }}
          >
            <Trophy size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Goals</span>
          </Link>

          <Link
            href="/"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === '/' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/' ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
            }}
          >
            <Home size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Home</span>
          </Link>

          <Link
            href="/categories"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === '/categories' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/categories' ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
            }}
          >
            <BarChart3 size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Categories</span>
          </Link>

          <Link
            href="/transactions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === '/transactions' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/transactions' ? 'rgba(74, 158, 255, 0.1)' : 'transparent'
            }}
          >
            <CreditCard size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Transactions</span>
          </Link>
        </div>
      </nav>

      {/* Click outside handlers */}
      {(showNotifications || showAddMenu || showTimePeriodDropdown || showProfileMenu) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20
          }}
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
