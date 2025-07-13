export interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account_name?: string;
  is_categorized_automatically?: boolean;
  confidence_score?: number;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period_type: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  description?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: string;
  is_active: boolean;
  created_at: string;
  description?: string;
}

export interface Category {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  priority: number;
  created_at: string;
}

export interface AIInsight {
  id: string;
  type: 'suggestion' | 'alert' | 'trend' | 'achievement';
  title: string;
  message: string;
  savings_potential?: number;
  category?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'mission' | 'achievement';
  read: boolean;
  created_at: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Budgets: undefined;
  Goals: undefined;
  Categories: undefined;
  Transactions: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};
