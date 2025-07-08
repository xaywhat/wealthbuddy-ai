'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  user_category?: string;
  category_source?: 'auto' | 'manual' | 'rule';
  creditor_name?: string;
  debtor_name?: string;
  account_id: string;
}

interface CategorizationRule {
  id: string;
  keyword: string;
  category: string;
  rule_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  priority: number;
}

interface SyncStatus {
  lastSync?: string;
  status: 'success' | 'error' | 'in_progress' | 'never' | 'no_accounts';
  needsSync: boolean;
  errorMessage?: string;
  accounts?: Array<{
    id: string;
    name: string;
    lastSync?: string;
    status: string;
    errorMessage?: string;
  }>;
  stats?: {
    totalAccounts: number;
    successfulAccounts: number;
    errorAccounts: number;
    neverSyncedAccounts: number;
    inProgressAccounts: number;
  };
}

interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  iban?: string;
  last_sync_date?: string;
  sync_status: string;
}

interface AIInsight {
  type: 'savings_opportunity' | 'spending_pattern' | 'budget_alert';
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: 'weekly' | 'monthly' | 'yearly';
}

interface AIAnalysis {
  totalSpent: number;
  categories: Record<string, {
    amount: number;
    percentage: number;
    transactions: number;
  }>;
  insights: AIInsight[];
  recommendations: Array<{
    id: string;
    category: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    savingsEstimate: number;
  }>;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  timeframe_days: number;
  status: 'active' | 'completed' | 'failed' | 'paused';
  category: string;
  created_at: string;
  deadline: string;
  completed_at?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'mission' | 'achievement';
  read: boolean;
  created_at: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  categories: string[];
  group_type: 'expense' | 'income' | 'mixed';
  is_default: boolean;
  created_at: string;
}

interface CategoryType {
  id: string;
  user_id: string | null;
  category_name: string;
  category_type: 'income' | 'expense';
  is_default: boolean;
  created_at: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [requisitionId, setRequisitionId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'transactions'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  
  // Categorization state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newRule, setNewRule] = useState({ keyword: '', category: '', ruleType: 'contains' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as 'expense' | 'income' });
  const [showCategoryList, setShowCategoryList] = useState(false);
  
  // Bank connection state for reconnection
  const [showBankModal, setShowBankModal] = useState(false);
  
  // Account cards expansion state
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  
  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'never', needsSync: true });
  const [syncing, setSyncing] = useState(false);
  
  // Missions and notifications state
  const [missions, setMissions] = useState<Mission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMissionsPopup, setShowMissionsPopup] = useState(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [feedbackAction, setFeedbackAction] = useState<'try_it' | 'already_done' | 'cant_do' | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  
  // Category selection and summation state
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'expense' | 'income' | 'mixed'>('expense');
  const [defaultExpenseGroup, setDefaultExpenseGroup] = useState<CategoryGroup | null>(null);
  const [defaultIncomeGroup, setDefaultIncomeGroup] = useState<CategoryGroup | null>(null);
  
  // Time period filtering state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [loadingFinancialSummary, setLoadingFinancialSummary] = useState(false);
  
  const router = useRouter();

  // Danish banks for demonstration
  const danishBanks = [
    { id: 'danske_andelskassers', name: 'Danske Andelskassers Bank', logo: '🏦' },
    { id: 'danske_bank', name: 'Danske Bank Private', logo: '🏦' },
    { id: 'nordea', name: 'Nordea', logo: '🏛️' },
    { id: 'jyske', name: 'Jyske Bank', logo: '🏪' },
    { id: 'sydbank', name: 'Sydbank', logo: '🏢' },
    { id: 'arbejdernes', name: 'Arbejdernes Landsbank', logo: '🏭' },
  ];

  // Category icons mapping - Expanded with more categories
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Internal Transfer': '🔄',
      'MobilePay': '📱',
      'Convenience Stores': '🏪',
      'Bills': '📄',
      'Gas': '⛽',
      'Waste': '🗑️',
      'Groceries': '🛒',
      'Transport': '🚌',
      'Entertainment': '🎬',
      'Dining': '🍽️',
      'Shopping': '🛍️',
      'Healthcare': '🏥',
      'Income': '💰',
      'Subscriptions': '📺',
      'Insurance': '🛡️',
      'Rent': '🏠',
      'Utilities': '💡',
      'Education': '📚',
      'Fitness': '💪',
      'Beauty': '💄',
      'Gifts': '🎁',
      'Travel': '✈️',
      'Parking': '🅿️',
      'ATM': '🏧',
      'Investment': '📈',
      'Loans': '💳',
      'Fees': '💸',
      'Pet Care': '🐕',
      'Home Improvement': '🔨',
      'Clothing': '👕',
      'Charity': '❤️',
      'Uncategorized': '❓',
    };
    return icons[category] || '📊';
  };

  // Check authentication and load data on page load
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('wealthbuddy_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Check for callback parameters (for Nordigen redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const status = urlParams.get('status');
    const error = urlParams.get('error');

    if (error) {
      setError(`Connection failed: ${error}`);
    } else if (ref && status === 'connected') {
      // Handle initial connection callback
      handleInitialConnection(ref, parsedUser.id);
    } else {
      // Load existing data from database
      loadUserData(parsedUser.id);
      loadMissionsAndNotifications(parsedUser.id);
      loadCategoryGroups(parsedUser.id);
      loadFinancialSummary(parsedUser.id, selectedPeriod);
    }
  }, [router]);

  // Load user data from database
  const loadUserData = async (userId: string) => {
    try {
      setIsConnecting(true);
      
      // Load accounts and transactions from database
      const [accountsRes, transactionsRes, syncStatusRes] = await Promise.all([
        fetch(`/api/data/accounts?userId=${userId}`),
        fetch(`/api/data/transactions?userId=${userId}`),
        fetch(`/api/data/sync-status?userId=${userId}`)
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success && accountsData.accounts.length > 0) {
          setBankAccounts(accountsData.accounts);
          setIsConnected(true);
        }
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.success) {
          setTransactions(transactionsData.transactions);
          
          // Load categorization data
          loadCategorizationData(userId);
          
          // Analyze transactions with AI if we have data
          if (transactionsData.transactions.length > 0) {
            analyzeTransactions(transactionsData.transactions);
          }
        }
      }

      if (syncStatusRes.ok) {
        const syncData = await syncStatusRes.json();
        setSyncStatus(syncData);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load your data');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle initial bank connection callback
  const handleInitialConnection = async (ref: string, userId: string) => {
    try {
      setIsConnecting(true);
      setRequisitionId(ref);
      
      const response = await fetch('/api/nordigen/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requisitionId: ref, userId }),
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.accounts);
        setTransactions(data.transactions);
        setIsConnected(true);
        
        // Load categorization data
        loadCategorizationData(userId);
        
        // Analyze transactions with AI
        if (data.transactions.length > 0) {
          analyzeTransactions(data.transactions);
        }

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError(data.error || 'Failed to fetch account data');
      }
    } catch (error) {
      console.error('Error handling initial connection:', error);
      setError('Failed to fetch account data');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle bank connection
  const handleBankConnection = async () => {
    if (!selectedBank || !user) {
      setError('Please select a bank first');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/nordigen/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bankId: selectedBank, userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setRequisitionId(data.requisitionId);
        // Redirect to bank authentication
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to connect to bank');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting to bank:', error);
      setError('Failed to connect to bank');
      setIsConnecting(false);
    }
  };

  // Handle sync transactions
  const handleSync = async () => {
    if (!user) return;

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload data after successful sync
        await loadUserData(user.id);
        
        // Show success message
        alert(`Sync completed! ${data.stats.newTransactions} new transactions added.`);
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      setError('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  // Refresh AI analysis
  const refreshAIAnalysis = async () => {
    if (transactions.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeTransactions(transactions);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadCategorizationData = async (userId: string) => {
    try {
      // Load available categories and rules
      const [categoriesRes, rulesRes] = await Promise.all([
        fetch(`/api/categories?userId=${userId}`),
        fetch(`/api/categories/rules?userId=${userId}`),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setAvailableCategories(categoriesData.categories || []);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setCategorizationRules(rulesData.rules || []);
      }
    } catch (error) {
      console.error('Error loading categorization data:', error);
    }
  };

  // Load missions and notifications data
  const loadMissionsAndNotifications = async (userId: string) => {
    try {
      const [missionsRes, notificationsRes] = await Promise.all([
        fetch(`/api/missions?userId=${userId}`),
        fetch(`/api/notifications?userId=${userId}`)
      ]);

      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        if (missionsData.success) {
          setMissions(missionsData.missions || []);
        }
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        if (notificationsData.success) {
          setNotifications(notificationsData.notifications || []);
          setUnreadCount(notificationsData.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading missions and notifications:', error);
    }
  };

  // Load category groups data
  const loadCategoryGroups = async (userId: string) => {
    try {
      const response = await fetch(`/api/category-groups?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategoryGroups(data.groups || []);
          
          // Set default groups
          const expenseDefault = data.groups.find((g: CategoryGroup) => g.group_type === 'expense' && g.is_default);
          const incomeDefault = data.groups.find((g: CategoryGroup) => g.group_type === 'income' && g.is_default);
          
          setDefaultExpenseGroup(expenseDefault || null);
          setDefaultIncomeGroup(incomeDefault || null);
        }
      }
    } catch (error) {
      console.error('Error loading category groups:', error);
    }
  };

  // Load financial summary and category types
  const loadFinancialSummary = async (userId: string, period: string = 'this_month') => {
    try {
      setLoadingFinancialSummary(true);
      
      const [summaryRes, typesRes] = await Promise.all([
        fetch(`/api/financial-summary?userId=${userId}&period=${period}`),
        fetch(`/api/categories/types?userId=${userId}`)
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setFinancialSummary(summaryData.summary);
        }
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (typesData.success) {
          setCategoryTypes(typesData.categoryTypes || []);
        }
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
    } finally {
      setLoadingFinancialSummary(false);
    }
  };

  const analyzeTransactions = async (transactionData: Transaction[]) => {
    try {
      setIsAnalyzing(true);
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: transactionData }),
      });

      const data = await response.json();

      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        console.error('AI analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Error analyzing transactions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(numAmount);
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Enhanced transaction categorization - Expanded with more categories
  const categorizeTransaction = (description: string, amount: number) => {
    const desc = description.toLowerCase();
    
    // Internal transfers
    if (desc.includes('fra forsikringer') || desc.includes('til forsikringer') || 
        desc.includes('overførsel') || desc.includes('transfer') ||
        desc.includes('fra løn') || desc.includes('til løn') ||
        (amount > 0 && desc.includes('fra '))) {
      return 'Internal Transfer';
    }
    
    // MobilePay
    if (desc.includes('mobilepay')) {
      return 'MobilePay';
    }
    
    // Insurance (separate from Bills)
    if (desc.includes('forsikring') || desc.includes('insurance') ||
        desc.includes('tryg') || desc.includes('alka') || desc.includes('codan')) {
      return 'Insurance';
    }
    
    // Rent/Housing
    if (desc.includes('husleje') || desc.includes('rent') || desc.includes('bolig') ||
        desc.includes('ejendom') || desc.includes('boligselskab') ||
        desc.includes('andelsbolig') || desc.includes('lejlighed')) {
      return 'Rent';
    }
    
    // Utilities (separate from Bills)
    if (desc.includes('el ') || desc.includes('elektricitet') || desc.includes('strøm') ||
        desc.includes('vand') || desc.includes('varme') || desc.includes('fjernvarme') ||
        desc.includes('gas') || desc.includes('energi')) {
      return 'Utilities';
    }
    
    // Convenience stores
    if (desc.includes('7-eleven') || desc.includes('7eleven') || 
        desc.includes('netto') || desc.includes('rema') || 
        desc.includes('irma') || desc.includes('fakta') ||
        desc.includes('convenience') || desc.includes('kiosk')) {
      return 'Convenience Stores';
    }
    
    // Bills (general)
    if (desc.includes('internet') || desc.includes('telefon') ||
        desc.includes('regning') || desc.includes('bill') ||
        desc.includes('tdc') || desc.includes('telenor') || desc.includes('3dk') ||
        desc.includes('yousee') || desc.includes('stofa')) {
      return 'Bills';
    }
    
    // Gas stations
    if (desc.includes('shell') || desc.includes('q8') || desc.includes('esso') ||
        desc.includes('ok benzin') || desc.includes('circle k') ||
        desc.includes('tank') || desc.includes('benzin')) {
      return 'Gas';
    }
    
    // Parking
    if (desc.includes('parkering') || desc.includes('parking') ||
        desc.includes('p-hus') || desc.includes('parkometre')) {
      return 'Parking';
    }
    
    // ATM/Cash
    if (desc.includes('hævning') || desc.includes('atm') || desc.includes('kontant') ||
        desc.includes('cash') || desc.includes('pengeautomat')) {
      return 'ATM';
    }
    
    // Waste management
    if (desc.includes('affald') || desc.includes('renovation') || 
        desc.includes('waste') || desc.includes('skrald')) {
      return 'Waste';
    }
    
    // Groceries (supermarkets)
    if (desc.includes('bilka') || desc.includes('føtex') || 
        desc.includes('kvickly') || desc.includes('super brugsen') ||
        desc.includes('meny') || desc.includes('aldi') || desc.includes('lidl') ||
        desc.includes('coop') || desc.includes('supermarked')) {
      return 'Groceries';
    }
    
    // Transport
    if (desc.includes('dsb') || desc.includes('metro') || desc.includes('bus') ||
        desc.includes('rejsekort') || desc.includes('transport') ||
        desc.includes('taxi') || desc.includes('uber') || desc.includes('s-tog') ||
        desc.includes('movia') || desc.includes('letbane')) {
      return 'Transport';
    }
    
    // Education
    if (desc.includes('skole') || desc.includes('universitet') || desc.includes('uddannelse') ||
        desc.includes('kursus') || desc.includes('education') || desc.includes('studium') ||
        desc.includes('bog') || desc.includes('pensum')) {
      return 'Education';
    }
    
    // Fitness/Gym
    if (desc.includes('fitness') || desc.includes('træning') || desc.includes('gym') ||
        desc.includes('sport') || desc.includes('motion') || desc.includes('wellness')) {
      return 'Fitness';
    }
    
    // Beauty/Personal Care
    if (desc.includes('frisør') || desc.includes('skønhed') || desc.includes('beauty') ||
        desc.includes('kosmetik') || desc.includes('massage') || desc.includes('spa') ||
        desc.includes('neglene') || desc.includes('barbering')) {
      return 'Beauty';
    }
    
    // Entertainment & Subscriptions
    if (desc.includes('spotify') || desc.includes('netflix') || 
        desc.includes('disney') || desc.includes('hbo') ||
        desc.includes('cinema') || desc.includes('bio') ||
        desc.includes('streaming') || desc.includes('abonnement')) {
      return 'Entertainment';
    }
    
    // Travel
    if (desc.includes('hotel') || desc.includes('rejse') || desc.includes('travel') ||
        desc.includes('fly') || desc.includes('lufthavn') || desc.includes('booking') ||
        desc.includes('ferie') || desc.includes('airbnb')) {
      return 'Travel';
    }
    
    // Restaurants & Dining
    if (desc.includes('restaurant') || desc.includes('cafe') || 
        desc.includes('pizza') || desc.includes('burger') ||
        desc.includes('mcdonalds') || desc.includes('kfc') ||
        desc.includes('dining') || desc.includes('takeaway') ||
        desc.includes('just eat') || desc.includes('wolt')) {
      return 'Dining';
    }
    
    // Clothing
    if (desc.includes('h&m') || desc.includes('zara') || 
        desc.includes('tøj') || desc.includes('clothing') ||
        desc.includes('sko') || desc.includes('shoes') ||
        desc.includes('fashion') || desc.includes('bestseller')) {
      return 'Clothing';
    }
    
    // Shopping (general)
    if (desc.includes('magasin') || desc.includes('illums') ||
        desc.includes('shopping') || desc.includes('butik') ||
        desc.includes('webshop') || desc.includes('online')) {
      return 'Shopping';
    }
    
    // Healthcare
    if (desc.includes('apotek') || desc.includes('læge') || 
        desc.includes('tandlæge') || desc.includes('hospital') ||
        desc.includes('sundhed') || desc.includes('health') ||
        desc.includes('medicin') || desc.includes('behandling')) {
      return 'Healthcare';
    }
    
    // Pet Care
    if (desc.includes('dyrlæge') || desc.includes('kæledyr') || desc.includes('hund') ||
        desc.includes('kat') || desc.includes('pet') || desc.includes('dyrehandel')) {
      return 'Pet Care';
    }
    
    // Home Improvement
    if (desc.includes('bauhaus') || desc.includes('silvan') || desc.includes('byggemarkeder') ||
        desc.includes('værktøj') || desc.includes('maling') || desc.includes('renovation') ||
        desc.includes('boligforbedring') || desc.includes('ikea')) {
      return 'Home Improvement';
    }
    
    // Gifts/Charity
    if (desc.includes('gave') || desc.includes('donation') || desc.includes('charity') ||
        desc.includes('velgørenhed') || desc.includes('støtte') || desc.includes('bidrag')) {
      return 'Gifts';
    }
    
    // Investment/Savings
    if (desc.includes('investering') || desc.includes('aktier') || desc.includes('pension') ||
        desc.includes('opsparing') || desc.includes('bank') || desc.includes('renter')) {
      return 'Investment';
    }
    
    // Loans/Credit
    if (desc.includes('lån') || desc.includes('kredit') || desc.includes('afdrag') ||
        desc.includes('renter') || desc.includes('gæld')) {
      return 'Loans';
    }
    
    // Fees/Charges
    if (desc.includes('gebyr') || desc.includes('fee') || desc.includes('afgift') ||
        desc.includes('omkostning') || desc.includes('charge')) {
      return 'Fees';
    }
    
    // Income
    if (amount > 0 && (desc.includes('salary') || desc.includes('løn') || 
        desc.includes('pension') || desc.includes('refund') ||
        desc.includes('tilbagebetaling') || desc.includes('indtægt'))) {
      return 'Income';
    }
    
    return 'Uncategorized';
  };

  // Clean up transaction description
  const formatTransactionDescription = (description: string) => {
    let cleaned = description;
    
    // Handle "Fra Forsikringer" case
    if (cleaned.toLowerCase().includes('fra forsikringer')) {
      return 'Fra Forsikringer';
    }
    
    // Handle MobilePay cases
    if (cleaned.toLowerCase().includes('mobilepay')) {
      const match = cleaned.match(/MobilePay\s+([^E]+?)(?:\s+EndToEndID|$)/i);
      if (match) {
        return `MobilePay ${match[1].trim()}`;
      }
    }
    
    // Remove EndToEndID and everything after it
    cleaned = cleaned.replace(/\s+EndToEndID:.*$/i, '');
    
    // Remove common noise patterns
    cleaned = cleaned.replace(/We have received the following payment from:?\s*/i, '');
    cleaned = cleaned.replace(/\s+\d{1,2},-?\d*\s+\d{4}\s+[A-ZÆØÅ\s]+$/i, ''); // Remove address patterns
    
    // Trim and clean up spacing
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Internal Transfer': 'bg-gray-100 text-gray-800',
      'MobilePay': 'bg-purple-100 text-purple-800',
      'Convenience Stores': 'bg-orange-100 text-orange-800',
      'Bills': 'bg-red-100 text-red-800',
      'Gas': 'bg-yellow-100 text-yellow-800',
      'Waste': 'bg-stone-100 text-stone-800',
      'Groceries': 'bg-green-100 text-green-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Dining': 'bg-amber-100 text-amber-800',
      'Shopping': 'bg-indigo-100 text-indigo-800',
      'Healthcare': 'bg-teal-100 text-teal-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Subscriptions': 'bg-violet-100 text-violet-800',
      'Uncategorized': 'bg-gray-100 text-gray-600',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  // Group transactions by category
  const getTransactionsByCategory = () => {
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(transaction => {
      const category = getEffectiveCategory(transaction);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(transaction);
    });
    return grouped;
  };

  // Get category totals (using filtered transactions for time period)
  const getCategoryTotals = () => {
    const transactionsToUse = selectedPeriod === 'all' ? transactions : filteredTransactions;
    const grouped: Record<string, Transaction[]> = {};
    
    transactionsToUse.forEach(transaction => {
      const category = getEffectiveCategory(transaction);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(transaction);
    });

    const totals: Record<string, { amount: number; count: number }> = {};
    Object.entries(grouped).forEach(([category, transactions]) => {
      const amount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      totals[category] = { amount, count: transactions.length };
    });
    
    return totals;
  };

  // Enhanced categorization functions
  const getEffectiveCategory = (transaction: Transaction): string => {
    return transaction.user_category || transaction.category || categorizeTransaction(transaction.description, transaction.amount);
  };

  const getCategoryColorBySource = (source?: string) => {
    switch (source) {
      case 'manual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rule': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleUpdateTransactionCategory = async (transactionId: string, newCategory: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/categories/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          userId: user.id,
          newCategory,
        }),
      });

      if (response.ok) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t.id === transactionId 
            ? { ...t, user_category: newCategory, category_source: 'manual' as const }
            : t
        ));
        setEditingTransaction(null);
      } else {
        alert('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wealthbuddy_user');
    router.push('/login');
  };

  // Time period filtering functions
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: new Date(now) };
      }
      case 'last_2_weeks': {
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);
        return { start: twoWeeksAgo, end: new Date(now) };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date(now) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      case 'last_3_months': {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo, end: new Date(now) };
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate + 'T23:59:59') 
          };
        }
        return null;
      }
      default:
        return null;
    }
  };

  const filterTransactionsByPeriod = (transactions: Transaction[], period: string) => {
    if (period === 'all') return transactions;
    
    const dateRange = getDateRange(period);
    if (!dateRange) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  };

  // Update filtered transactions when period or transactions change
  useEffect(() => {
    const filtered = filterTransactionsByPeriod(transactions, selectedPeriod);
    setFilteredTransactions(filtered);
  }, [transactions, selectedPeriod, customStartDate, customEndDate]);

  // Reload financial summary when period changes
  useEffect(() => {
    if (user && isConnected) {
      loadFinancialSummary(user.id, selectedPeriod);
    }
  }, [selectedPeriod, user, isConnected]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // Calculate sync percentage for account cards
  const calculateSyncPercentage = (account: BankAccount) => {
    if (!account.last_sync_date) return 0;
    const lastSync = new Date(account.last_sync_date);
    const now = new Date();
    const daysSinceSync = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider 100% if synced within last day, decreasing over time
    if (daysSinceSync === 0) return 100;
    if (daysSinceSync === 1) return 85;
    if (daysSinceSync <= 3) return 75;
    if (daysSinceSync <= 7) return 60;
    return 30;
  };

  // Handle rule creation
  const handleCreateRule = async () => {
    if (!user || !newRule.keyword || !newRule.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/categories/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          keyword: newRule.keyword,
          category: newRule.category,
          ruleType: newRule.ruleType,
          priority: 0,
        }),
      });

      if (response.ok) {
        // Reload rules
        await loadCategorizationData(user.id);
        
        // Reset form and close modal
        setNewRule({ keyword: '', category: '', ruleType: 'contains' });
        setShowRulesModal(false);
        
        alert('Rule created successfully!');
      } else {
        alert('Failed to create rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule');
    }
  };

  // Handle rule deletion
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/categories/rules?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload rules
        if (user) {
          await loadCategorizationData(user.id);
        }
        alert('Rule deleted successfully!');
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  };

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!user || !newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'create',
          categoryName: newCategory.name.trim(),
          categoryType: newCategory.type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload categories
        await loadCategorizationData(user.id);
        
        // Reset form and close modal
        setNewCategory({ name: '', type: 'expense' });
        setShowCategoryModal(false);
        
        alert(`Category "${newCategory.name}" created successfully!`);
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryName: string) => {
    if (!user) return;

    // Don't allow deletion of default categories
    const defaultCategories = [
      'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
      'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Stores',
      'Internal Transfer', 'Income', 'Uncategorized'
    ];

    if (defaultCategories.includes(categoryName)) {
      alert('Cannot delete default categories');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"? All transactions in this category will be marked as uncategorized.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/delete?userId=${user.id}&category=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Reload categories and transactions
        await Promise.all([
          loadCategorizationData(user.id),
          loadUserData(user.id)
        ]);
        
        alert(data.message);
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header with Financial Summary */}
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">WealthBuddy</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg">
              +
            </button>
            <button 
              onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center relative"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              {user?.keyphrase?.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
        
        {/* Financial Summary Bar */}
        {isConnected && financialSummary && (
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
                  {formatCurrency(financialSummary.totalExpenses)}
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
        )}
        
        {/* Loading state for financial summary */}
        {isConnected && loadingFinancialSummary && (
          <div className="flex items-center justify-center text-xs bg-gray-50 rounded-lg px-3 py-2">
            <div className="animate-pulse flex space-x-4">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        )}
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        /* Bank Connection Section */
        <div className="px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Connect your Danish bank accounts and get AI-powered insights into your spending habits
              </h2>
              <button
                onClick={refreshAIAnalysis}
                disabled={isAnalyzing || transactions.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
              >
                {isAnalyzing ? 'Analyzing...' : 'Refresh AI Analysis'}
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your bank:
              </label>
              <div className="space-y-3">
                {danishBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => setSelectedBank(bank.id)}
                    className={`w-full p-4 border-2 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                      selectedBank === bank.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{bank.logo}</span>
                    <span className="font-medium text-gray-800">{bank.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBankConnection}
              disabled={isConnecting || !selectedBank}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Connect Securely</span>
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 mt-4 text-center">
              🔒 Secure connection powered by Nordigen (PSD2 compliant)
            </p>
          </div>
        </div>
      ) : (
        /* Main Dashboard Content */
        <div className="px-4 py-6 space-y-6">
          {/* Collapsible Account Cards */}
          <div className="bg-white rounded-xl shadow-sm">
            {!accountsExpanded ? (
              /* Collapsed State - Summary Card */
              <div className="p-6">
                <button
                  onClick={() => setAccountsExpanded(true)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Your Bank Accounts ({bankAccounts.length})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Total Balance: {formatCurrency(bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {bankAccounts.filter(acc => acc.sync_status === 'success').length} synced
                      </p>
                      <p className="text-xs text-blue-600">Click to expand</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
              </div>
            ) : (
              /* Expanded State - Individual Account Cards */
              <div className="p-6 space-y-4">
                <button
                  onClick={() => setAccountsExpanded(false)}
                  className="w-full flex items-center justify-between mb-4 pb-4 border-b border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Your Bank Accounts ({bankAccounts.length})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Total Balance: {formatCurrency(bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-blue-600">Click to collapse</p>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </button>

                {/* Individual Account Cards */}
                {bankAccounts.map((account) => {
                  const syncPercentage = calculateSyncPercentage(account);
                  return (
                    <div key={account.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800">
                            {account.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {account.iban?.slice(0, 4)}****{account.iban?.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {account.sync_status === 'success' ? 'Synced' : 'Sync needed'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(account.balance)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {account.last_sync_date 
                                ? new Date(account.last_sync_date).toLocaleDateString('da-DK')
                                : 'Never synced'}
                            </p>
                          </div>
                          {/* Smaller Circular Progress Indicator */}
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-200"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-blue-600"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${syncPercentage}, 100`}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-600">{syncPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Spending Insights */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-800">AI Spending Insights</h3>
            </div>
            
            {aiAnalysis ? (
              <div className="space-y-4">
                {aiAnalysis.insights.slice(0, 1).map((insight, index) => (
                  <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-gray-800 text-sm">
                      {insight.description}
                    </p>
                    {insight.potentialSavings > 0 && (
                      <p className="text-yellow-700 mt-2 font-medium text-sm">
                        <strong>Potential Savings:</strong> {formatCurrency(insight.potentialSavings)} per {insight.timeframe}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-gray-500 mt-2 text-sm">Analyzing your spending patterns...</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          {activeTab === 'dashboard' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-blue-600 text-sm font-medium"
                >
                  See All
                </button>
              </div>
              
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getCategoryIcon(getEffectiveCategory(transaction))}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {getEffectiveCategory(transaction)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${getTransactionColor(transaction.amount)}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Management (when activeTab is categories) */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Advanced Category Management</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                  >
                    <option value="all">All Time</option>
                    <option value="last_month">Last 30 days</option>
                    <option value="this_month">This Month</option>
                  </select>
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    + Category
                  </button>
                  <button 
                    onClick={() => setShowRulesModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    + Rule
                  </button>
                  <button 
                    onClick={() => setShowCategoryList(!showCategoryList)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {/* Category Management List */}
              {showCategoryList && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Manage Categories</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {availableCategories.map((category) => {
                      const isDefault = [
                        'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
                        'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Stores',
                        'Internal Transfer', 'Income', 'Uncategorized'
                      ].includes(category);
                      
                      return (
                        <div key={category} className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{getCategoryIcon(category)}</span>
                            <span className="text-sm font-medium">{category}</span>
                            {isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                            )}
                          </div>
                          {!isDefault && (
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show ALL Categories - Not just top 8 */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(getCategoryTotals())
                  .sort(([,a], [,b]) => b.amount - a.amount)
                  .map(([category, data]) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setActiveTab('transactions');
                      }}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="font-medium text-gray-900 text-sm">{category}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {data.count} transactions
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-green-600">+ 5.6%</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Transactions View (when activeTab is transactions) */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedCategory ? `${selectedCategory} Transactions` : 'All Transactions'}
                  </h3>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-blue-600 text-sm mt-1"
                    >
                      ← Back to all transactions
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                  >
                    <option value="all">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="last_2_weeks">Last 2 Weeks</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_3_months">Last 3 Months</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Transactions List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {(selectedCategory 
                  ? (selectedPeriod === 'all' ? transactions : filteredTransactions).filter(t => getEffectiveCategory(t) === selectedCategory)
                  : (selectedPeriod === 'all' ? transactions : filteredTransactions)
                ).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getCategoryIcon(getEffectiveCategory(transaction))}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 text-sm">
                            {formatTransactionDescription(transaction.description)}
                          </p>
                          {editingTransaction === transaction.id ? (
                            <select
                              value={getEffectiveCategory(transaction)}
                              onChange={(e) => handleUpdateTransactionCategory(transaction.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-900"
                            >
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <span 
                              className={`text-xs px-2 py-1 rounded-full cursor-pointer ${getCategoryColor(getEffectiveCategory(transaction))}`}
                              onClick={() => setEditingTransaction(transaction.id)}
                            >
                              {getEffectiveCategory(transaction)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.date).toLocaleDateString('da-DK')} • 
                          {transaction.creditor_name || transaction.debtor_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${getTransactionColor(transaction.amount)}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {transaction.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Showing {(selectedCategory 
                    ? (selectedPeriod === 'all' ? transactions : filteredTransactions).filter(t => getEffectiveCategory(t) === selectedCategory)
                    : (selectedPeriod === 'all' ? transactions : filteredTransactions)
                  ).length} transactions
                  {selectedCategory && ` in ${selectedCategory}`}
                  {selectedPeriod !== 'all' && ` for ${selectedPeriod.replace('_', ' ')}`}
                </p>
              </div>
            </div>
          )}

          {/* Sync Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Sync</p>
                <p className="text-xs text-gray-500">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleString('da-DK')
                    : 'Never'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBankModal(true)}
                  disabled={isConnecting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Bank'}
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  {syncing ? 'Syncing...' : 'Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation - Clean 3-tab design */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-sm font-medium">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg ${
              activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-sm font-medium">Categories</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveTab('transactions');
            }}
            className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg ${
              activeTab === 'transactions' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">💳</span>
            <span className="text-sm font-medium">Transactions</span>
          </button>
        </div>
      </nav>

      {/* Notifications Popup */}
      {showNotificationsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-xl w-full max-w-md max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <button
                  onClick={() => setShowNotificationsPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No notifications</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Missions Popup */}
      {showMissionsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-xl w-full max-w-md max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Missions</h3>
                <button
                  onClick={() => setShowMissionsPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              {missions.length > 0 ? (
                <div className="space-y-3">
                  {missions.slice(0, 5).map((mission) => (
                    <div key={mission.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm">{mission.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{mission.description}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{formatCurrency(mission.current_amount)} / {formatCurrency(mission.target_amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((mission.current_amount / mission.target_amount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active missions</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rules Creation Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create Categorization Rule</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  value={newRule.keyword}
                  onChange={(e) => setNewRule(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="e.g., 'netto', 'spotify', 'mobilepay'"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Transactions containing this keyword will be automatically categorized
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="">Select a category</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <select
                  value={newRule.ruleType}
                  onChange={(e) => setNewRule(prev => ({ ...prev, ruleType: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="contains">Contains keyword</option>
                  <option value="starts_with">Starts with keyword</option>
                  <option value="ends_with">Ends with keyword</option>
                  <option value="exact">Exact match</option>
                </select>
              </div>

              {/* Show existing rules */}
              {categorizationRules.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Rules</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {categorizationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                        <div className="text-xs">
                          <span className="font-medium">"{rule.keyword}"</span>
                          <span className="text-gray-500"> → {rule.category}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={!newRule.keyword || !newRule.category}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 'Coffee Shops', 'Gym Membership', 'Pet Supplies'"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name for your new category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Type
                </label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as 'expense' | 'income' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select whether this category is for expenses or income
                </p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Connection Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Connect Bank Account</h3>
                <button
                  onClick={() => setShowBankModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Connect additional bank accounts or reconnect if your current connection has expired.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your bank:
                </label>
                <div className="space-y-3">
                  {danishBanks.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank.id)}
                      className={`w-full p-3 border-2 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                        selectedBank === bank.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{bank.logo}</span>
                      <span className="font-medium text-gray-800 text-sm">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowBankModal(false);
                    setSelectedBank('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBankModal(false);
                    handleBankConnection();
                  }}
                  disabled={!selectedBank || isConnecting}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-400"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Securely'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                🔒 Secure connection powered by Nordigen (PSD2 compliant)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
