import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import type {
  User,
  FinancialSummary,
  Account,
  Transaction,
  Budget,
  Goal,
  Category,
  CategoryRule,
  AIInsight,
  Notification
} from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (keyphrase: string) => {
    const response = await api.post('/api/auth/login', { keyphrase });
    return response.data;
  },
};

// Financial Summary API
export const financialAPI = {
  getSummary: async (userId: string, period?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ userId });
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/financial-summary?${params}`);
    return response.data;
  },
};

// Accounts API
export const accountsAPI = {
  getAccounts: async (userId: string) => {
    const response = await api.get(`/api/data/accounts?userId=${userId}`);
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (userId: string, limit?: number) => {
    const params = new URLSearchParams({ userId });
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/api/data/transactions?${params}`);
    return response.data;
  },
  
  suggestCategory: async (transactionId: string) => {
    const response = await api.post('/api/transactions/suggest-category', { transactionId });
    return response.data;
  },
};

// Budgets API
export const budgetsAPI = {
  getBudgets: async (userId: string) => {
    const response = await api.get(`/api/budgets?userId=${userId}`);
    return response.data;
  },
  
  createBudget: async (userId: string, budget: Partial<Budget>) => {
    const response = await api.post('/api/budgets', { userId, budget });
    return response.data;
  },
  
  deleteBudget: async (budgetId: string) => {
    const response = await api.delete(`/api/budgets?budgetId=${budgetId}`);
    return response.data;
  },
};

// Goals API
export const goalsAPI = {
  getGoals: async (userId: string) => {
    const response = await api.get(`/api/goals?userId=${userId}`);
    return response.data;
  },
  
  createGoal: async (userId: string, goal: Partial<Goal>) => {
    const response = await api.post('/api/goals', { userId, goal });
    return response.data;
  },
  
  deleteGoal: async (goalId: string) => {
    const response = await api.delete(`/api/goals?goalId=${goalId}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async (userId: string) => {
    const response = await api.get(`/api/categories?userId=${userId}`);
    return response.data;
  },
  
  getRules: async (userId: string) => {
    const response = await api.get(`/api/categories/rules?userId=${userId}`);
    return response.data;
  },
  
  createRule: async (userId: string, rule: Partial<CategoryRule>) => {
    const response = await api.post('/api/categories/rules', { userId, rule });
    return response.data;
  },
  
  deleteRule: async (ruleId: string) => {
    const response = await api.delete(`/api/categories/rules?ruleId=${ruleId}`);
    return response.data;
  },
};

// Insights API
export const insightsAPI = {
  getInsights: async (userId: string, limit?: number) => {
    const params = new URLSearchParams({ userId });
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/api/insights?${params}`);
    return response.data;
  },
  
  getAnomalies: async (userId: string) => {
    const response = await api.get(`/api/insights/anomalies?userId=${userId}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (userId: string) => {
    const response = await api.get(`/api/notifications?userId=${userId}`);
    return response.data;
  },
  
  markAsRead: async (notificationId: string) => {
    const response = await api.patch('/api/notifications', {
      notificationId,
      action: 'mark_read'
    });
    return response.data;
  },
};

// Export default api instance for custom requests
export default api;
