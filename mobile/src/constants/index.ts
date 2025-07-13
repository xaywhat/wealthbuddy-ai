// API Configuration - using Vercel URL in production
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : 'https://wealthbuddy-ai.vercel.app';

// Colors
export const COLORS = {
  // Background Colors
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2a2a2a',
  bgCard: '#2f2f2f',
  
  // Text Colors
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  textMuted: '#808080',
  
  // Accent Colors
  accentBlue: '#4a9eff',
  accentGreen: '#4ade80',
  accentRed: '#ef4444',
  accentYellow: '#f59e0b',
  
  // Border
  borderColor: '#404040',
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardOverlay: 'rgba(255, 255, 255, 0.05)',
};

// Typography
export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'wealthbuddy_user',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
};

// Category Icons
export const CATEGORY_ICONS: Record<string, string> = {
  'Groceries': '🛒',
  'Transport': '🚌',
  'Dining': '🍽️',
  'Shopping': '🛍️',
  'Bills': '📄',
  'Entertainment': '🎬',
  'Healthcare': '🏥',
  'Gas': '⛽',
  'Convenience Stores': '🏪',
  'MobilePay': '📱',
  'Subscriptions': '📺',
  'Insurance': '🛡️',
  'Rent': '🏠',
  'Utilities': '💡',
  'Education': '📚',
  'Fitness': '💪',
  'Beauty': '💄',
  'Gifts': '🎁',
  'Travel': '✈️',
  'Clothing': '👕',
  'Pet Care': '🐕',
  'Home Improvement': '🔨',
  'Charity': '❤️',
  'Investment': '📈',
  'Loans': '💳',
  'Fees': '💸',
  'ATM': '🏧',
  'Parking': '🅿️',
  'Income': '💰',
  'Internal Transfer': '🔄',
  'Uncategorized': '❓',
};

// Time Period Options
export const TIME_PERIODS = [
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

// Goal Types
export const GOAL_TYPES = [
  { key: 'savings', label: 'Savings', icon: '💰' },
  { key: 'emergency_fund', label: 'Emergency Fund', icon: '🆘' },
  { key: 'vacation', label: 'Vacation', icon: '✈️' },
  { key: 'purchase', label: 'Major Purchase', icon: '🛍️' },
  { key: 'investment', label: 'Investment', icon: '📈' },
  { key: 'debt_reduction', label: 'Debt Reduction', icon: '📉' },
];

// Budget Periods
export const BUDGET_PERIODS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];
