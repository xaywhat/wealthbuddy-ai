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
    return response.data.budgets || [];
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
    return response.data.goals || [];
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
    return response.data.insights || response.data;
  },
  
  getAnomalies: async (userId: string) => {
    const response = await api.get(`/api/insights/anomalies?userId=${userId}`);
    return response.data.anomalies || response.data;
  },

  generateInsights: async (userId: string) => {
    const response = await api.post('/api/insights/generate', { userId });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (userId: string) => {
    const response = await api.get(`/api/notifications?userId=${userId}`);
    return response.data.notifications || response.data;
  },
  
  markAsRead: async (notificationId: string) => {
    const response = await api.patch('/api/notifications', {
      notificationId,
      action: 'mark_read'
    });
    return response.data;
  },
};

// Achievements API
export const achievementsAPI = {
  getAchievements: async (userId: string) => {
    const response = await api.get(`/api/achievements?userId=${userId}`);
    return response.data.achievements || response.data;
  },
  
  checkNewAchievements: async (userId: string) => {
    const response = await api.post('/api/achievements', { userId });
    return response.data;
  },
};

// Subscriptions API
export const subscriptionsAPI = {
  getSubscriptions: async (userId: string) => {
    const response = await api.get(`/api/subscriptions?userId=${userId}`);
    return response.data.subscriptions || response.data;
  },
  
  detectSubscriptions: async (userId: string) => {
    const response = await api.post('/api/subscriptions', { userId, action: 'detect' });
    return response.data;
  },
  
  updateSubscription: async (subscriptionId: string, updates: any) => {
    const response = await api.patch('/api/subscriptions', { subscriptionId, updates });
    return response.data;
  },
};

// Internal Transfers API
export const internalTransfersAPI = {
  getInternalTransfers: async (userId: string) => {
    const response = await api.get(`/api/internal-transfers?userId=${userId}`);
    return response.data.transfers || response.data;
  },
  
  detectTransfers: async (userId: string) => {
    const response = await api.post('/api/internal-transfers/detect', { userId });
    return response.data;
  },
  
  manualTransfer: async (userId: string, fromTransactionId: string, toTransactionId: string) => {
    const response = await api.post('/api/internal-transfers/manual', { 
      userId, 
      fromTransactionId, 
      toTransactionId 
    });
    return response.data;
  },
};

// Nordigen API
export const nordigenAPI = {
  getInstitutions: async (country: string = 'DK') => {
    const response = await api.get(`/api/nordigen/institutions?country=${country}`);
    return response.data.institutions || response.data;
  },
  
  connect: async (userId: string, bankId: string) => {
    // For now, let's create a workaround since backend changes aren't deployed
    // We'll modify the returned URL to point to mobile callback
    const response = await api.post('/api/nordigen/connect', { 
      userId, 
      bankId
    });
    
    const result = response.data;
    
    // If we got a success response with authUrl, modify it to use mobile callback
    if (result.success && result.authUrl) {
      console.log('Original authUrl:', result.authUrl);
      
      // The authUrl contains a callback parameter - we need to replace it
      // This is a temporary workaround until backend is updated
      const url = new URL(result.authUrl);
      const callback = url.searchParams.get('redirect_uri') || url.searchParams.get('redirect');
      
      if (callback) {
        // Replace the callback URL with mobile-specific one
        const newCallback = callback.replace('/api/nordigen/callback', '/api/nordigen/mobile-callback');
        
        if (url.searchParams.get('redirect_uri')) {
          url.searchParams.set('redirect_uri', newCallback);
        } else if (url.searchParams.get('redirect')) {
          url.searchParams.set('redirect', newCallback);
        }
        
        result.authUrl = url.toString();
        console.log('Modified authUrl for mobile:', result.authUrl);
      }
    }
    
    return result;
  },
  
  getAccounts: async (userId: string) => {
    const response = await api.get(`/api/nordigen/accounts?userId=${userId}`);
    return response.data.accounts || response.data;
  },
};

// Data Sync API
export const syncAPI = {
  syncData: async (userId: string) => {
    const response = await api.post('/api/data/sync', { userId });
    return response.data;
  },
  
  getSyncStatus: async (userId: string) => {
    const response = await api.get(`/api/data/sync-status?userId=${userId}`);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  getPreferences: async (userId: string) => {
    const response = await api.get(`/api/profile/preferences?userId=${userId}`);
    return response.data.preferences || response.data;
  },
  
  updatePreferences: async (userId: string, preferences: any) => {
    const response = await api.patch('/api/profile/preferences', { userId, preferences });
    return response.data;
  },
  
  getStats: async (userId: string) => {
    const response = await api.get(`/api/profile/stats?userId=${userId}`);
    return response.data.stats || response.data;
  },
};

// User Feedback API
export const feedbackAPI = {
  submitFeedback: async (userId: string, feedback: any) => {
    const response = await api.post('/api/user-feedback', { userId, feedback });
    return response.data;
  },
};

// Export default api instance for custom requests
export default api;
