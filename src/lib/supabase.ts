import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface User {
  id: string;
  keyphrase: string;
  created_at: string;
}

export interface BankConnection {
  id: string;
  user_id: string;
  requisition_id: string;
  institution_id: string;
  status: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  nordigen_account_id: string;
  name: string;
  iban?: string;
  currency: string;
  balance: number;
  last_updated: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  nordigen_transaction_id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  user_category?: string;
  category_source?: 'auto' | 'manual' | 'rule';
  creditor_name?: string;
  debtor_name?: string;
  created_at: string;
}

export interface CategorizationRule {
  id: string;
  user_id: string;
  keyword: string;
  category: string;
  rule_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategoryUpdate {
  id: string;
  transaction_id: string;
  user_id: string;
  old_category?: string;
  new_category: string;
  update_reason: 'manual' | 'rule' | 'bulk';
  created_at: string;
}

export interface InternalTransferRule {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  last_sync: string;
  status: 'success' | 'error' | 'in_progress';
  error_message?: string;
  created_at: string;
}

export interface CategoryType {
  id: string;
  user_id: string | null;
  category_name: string;
  category_type: 'income' | 'expense';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  country: string;
  merchant_type: string;
  is_danish_specific: boolean;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface InternalTransfer {
  id: string;
  user_id: string;
  from_transaction_id: string;
  to_transaction_id: string;
  amount: number;
  transfer_date: string;
  detection_confidence: number;
  detection_method: string;
  user_confirmed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  period_type: 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  auto_adjust: boolean;
  alert_threshold: number;
  created_by: 'user' | 'ai_suggestion';
  created_at: string;
  updated_at: string;
}

export interface BudgetAlert {
  id: string;
  user_id: string;
  budget_id: string;
  alert_type: string;
  message: string;
  amount_spent: number;
  amount_remaining: number;
  percentage_used: number;
  is_read: boolean;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: 'savings' | 'debt_payoff' | 'vacation' | 'emergency_fund';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  auto_save_amount?: number;
  auto_save_frequency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  merchant_name: string;
  service_name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  next_payment_date?: string;
  category: string;
  is_active: boolean;
  detection_confidence: number;
  first_detected: string;
  last_payment_date?: string;
  auto_detected: boolean;
  user_confirmed: boolean | null;
  cancellation_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress_value?: number;
  is_claimed: boolean;
  created_at: string;
}

export interface SavingChallenge {
  id: string;
  user_id: string;
  challenge_type: string;
  name: string;
  description: string;
  target_amount?: number;
  target_days?: number;
  start_date: string;
  end_date: string;
  current_progress: number;
  is_completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_points: number;
  status: 'active' | 'completed' | 'failed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface FinancialInsight {
  id: string;
  user_id: string;
  insight_type: string;
  title: string;
  description: string;
  actionable_advice?: string;
  potential_savings?: number;
  confidence_score: number;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  is_acted_upon: boolean;
  valid_until?: string;
  created_at: string;
}

export interface UserPreferences {
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

// Database utility functions
export class DatabaseService {
  // User management
  static async findOrCreateUser(keyphrase: string): Promise<User> {
    // First try to find existing user
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('keyphrase', keyphrase)
      .single();

    if (existingUser && !findError) {
      return existingUser;
    }

    // Create new user if not found
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({ keyphrase })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return newUser;
  }

  // Bank connection management
  static async saveBankConnection(
    userId: string,
    requisitionId: string,
    institutionId: string,
    status: string
  ): Promise<BankConnection> {
    const { data, error } = await supabaseAdmin
      .from('bank_connections')
      .insert({
        user_id: userId,
        requisition_id: requisitionId,
        institution_id: institutionId,
        status,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save bank connection: ${error.message}`);
    }

    return data;
  }

  static async getBankConnections(userId: string): Promise<BankConnection[]> {
    const { data, error } = await supabaseAdmin
      .from('bank_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get bank connections: ${error.message}`);
    }

    return data || [];
  }

  // Account management
  static async saveAccounts(userId: string, accounts: Omit<Account, 'id' | 'user_id' | 'last_updated'>[]): Promise<Account[]> {
    const accountsWithUserId = accounts.map(account => ({
      ...account,
      user_id: userId,
      last_updated: new Date().toISOString(),
    }));

    // Upsert accounts (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .upsert(accountsWithUserId, {
        onConflict: 'nordigen_account_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Failed to save accounts: ${error.message}`);
    }

    return data || [];
  }

  static async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get accounts: ${error.message}`);
    }

    return data || [];
  }

  // Transaction management
  static async saveTransactions(accountId: string, transactions: Omit<Transaction, 'id' | 'account_id' | 'created_at'>[]): Promise<Transaction[]> {
    const transactionsWithAccountId = transactions.map(transaction => ({
      ...transaction,
      account_id: accountId,
    }));

    // Upsert transactions (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .upsert(transactionsWithAccountId, {
        onConflict: 'nordigen_transaction_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Failed to save transactions: ${error.message}`);
    }

    return data || [];
  }

  static async getTransactions(userId: string, limit: number = 1000): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return data || [];
  }

  // Sync log management
  static async createSyncLog(userId: string, status: 'success' | 'error' | 'in_progress', errorMessage?: string): Promise<SyncLog> {
    const { data, error } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        user_id: userId,
        last_sync: new Date().toISOString(),
        status,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sync log: ${error.message}`);
    }

    return data;
  }

  static async getLastSyncLog(userId: string): Promise<SyncLog | null> {
    const { data, error } = await supabaseAdmin
      .from('sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to get last sync log: ${error.message}`);
    }

    return data;
  }

  static async updateSyncLog(syncLogId: string, status: 'success' | 'error', errorMessage?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('sync_logs')
      .update({
        status,
        error_message: errorMessage,
        last_sync: new Date().toISOString(),
      })
      .eq('id', syncLogId);

    if (error) {
      throw new Error(`Failed to update sync log: ${error.message}`);
    }
  }

  // Check if data needs syncing (older than X hours)
  static async needsSync(userId: string, maxAgeHours: number = 6): Promise<boolean> {
    const lastSync = await this.getLastSyncLog(userId);
    
    if (!lastSync || lastSync.status === 'error') {
      return true;
    }

    const lastSyncTime = new Date(lastSync.last_sync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync > maxAgeHours;
  }

  // Categorization rules management
  static async getCategorizationRules(userId: string): Promise<CategorizationRule[]> {
    const { data, error } = await supabaseAdmin
      .from('categorization_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get categorization rules: ${error.message}`);
    }

    return data || [];
  }

  static async createCategorizationRule(
    userId: string,
    keyword: string,
    category: string,
    ruleType: 'contains' | 'starts_with' | 'ends_with' | 'exact' = 'contains',
    priority: number = 0
  ): Promise<CategorizationRule> {
    const { data, error } = await supabaseAdmin
      .from('categorization_rules')
      .insert({
        user_id: userId,
        keyword,
        category,
        rule_type: ruleType,
        priority,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create categorization rule: ${error.message}`);
    }

    return data;
  }

  static async updateCategorizationRule(
    ruleId: string,
    updates: Partial<Pick<CategorizationRule, 'keyword' | 'category' | 'rule_type' | 'priority'>>
  ): Promise<CategorizationRule> {
    const { data, error } = await supabaseAdmin
      .from('categorization_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update categorization rule: ${error.message}`);
    }

    return data;
  }

  static async deleteCategorizationRule(ruleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('categorization_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      throw new Error(`Failed to delete categorization rule: ${error.message}`);
    }
  }

  // Transaction category management
  static async updateTransactionCategory(
    transactionId: string,
    userId: string,
    newCategory: string,
    updateReason: 'manual' | 'rule' | 'bulk' = 'manual'
  ): Promise<void> {
    try {
      // First, get the current transaction to check ownership and get old category
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          accounts!inner(user_id)
        `)
        .eq('id', transactionId)
        .eq('accounts.user_id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Transaction not found or access denied: ${fetchError.message}`);
      }

      const oldCategory = transaction.user_category || transaction.category;

      // Update the transaction's user_category
      const { error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({
          user_category: newCategory,
          category_source: updateReason
        })
        .eq('id', transactionId);

      if (updateError) {
        throw new Error(`Failed to update transaction: ${updateError.message}`);
      }

      // Create audit trail entry
      const { error: auditError } = await supabaseAdmin
        .from('transaction_category_updates')
        .insert({
          transaction_id: transactionId,
          user_id: userId,
          old_category: oldCategory,
          new_category: newCategory,
          update_reason: updateReason
        });

      if (auditError) {
        console.warn('Failed to create audit trail:', auditError.message);
        // Don't throw error for audit trail failure
      }
    } catch (error) {
      throw new Error(`Failed to update transaction category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async bulkUpdateTransactionCategories(
    transactionIds: string[],
    userId: string,
    newCategory: string
  ): Promise<void> {
    // Update multiple transactions in a batch
    for (const transactionId of transactionIds) {
      await this.updateTransactionCategory(transactionId, userId, newCategory, 'bulk');
    }
  }

  static async applyCategorizationRules(userId: string): Promise<number> {
    try {
      // Get all categorization rules for the user
      const rules = await this.getCategorizationRules(userId);
      
      if (rules.length === 0) {
        return 0;
      }

      // Get all transactions for the user that don't have user_category set
      const { data: transactions, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          accounts!inner(user_id)
        `)
        .eq('accounts.user_id', userId)
        .is('user_category', null);

      if (fetchError) {
        throw new Error(`Failed to fetch transactions: ${fetchError.message}`);
      }

      let updatedCount = 0;

      // Apply rules to each transaction
      for (const transaction of transactions || []) {
        const description = transaction.description?.toLowerCase() || '';
        const creditorName = transaction.creditor_name?.toLowerCase() || '';
        const debtorName = transaction.debtor_name?.toLowerCase() || '';
        
        // Find the first matching rule (rules are ordered by priority)
        for (const rule of rules) {
          const keyword = rule.keyword.toLowerCase();
          let matches = false;

          const textToCheck = `${description} ${creditorName} ${debtorName}`;

          switch (rule.rule_type) {
            case 'contains':
              matches = textToCheck.includes(keyword);
              break;
            case 'starts_with':
              matches = description.startsWith(keyword) || 
                       creditorName.startsWith(keyword) || 
                       debtorName.startsWith(keyword);
              break;
            case 'ends_with':
              matches = description.endsWith(keyword) || 
                       creditorName.endsWith(keyword) || 
                       debtorName.endsWith(keyword);
              break;
            case 'exact':
              matches = description === keyword || 
                       creditorName === keyword || 
                       debtorName === keyword;
              break;
          }

          if (matches) {
            // Update the transaction with the rule's category
            await this.updateTransactionCategory(
              transaction.id,
              userId,
              rule.category,
              'rule'
            );
            updatedCount++;
            break; // Stop checking other rules for this transaction
          }
        }
      }

      return updatedCount;
    } catch (error) {
      throw new Error(`Failed to apply categorization rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getTransactionCategoryUpdates(userId: string, limit: number = 100): Promise<TransactionCategoryUpdate[]> {
    const { data, error } = await supabaseAdmin
      .from('transaction_category_updates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get transaction category updates: ${error.message}`);
    }

    return data || [];
  }

  // Helper method to get effective category (user_category if set, otherwise category)
  static getEffectiveCategory(transaction: Transaction): string {
    return transaction.user_category || transaction.category || 'Uncategorized';
  }

  // Category Types Management
  static async getCategoryTypes(userId: string): Promise<CategoryType[]> {
    const { data, error } = await supabaseAdmin
      .from('category_types')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('is_default', { ascending: false })
      .order('category_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to get category types: ${error.message}`);
    }

    return data || [];
  }

  static async createCategoryType(
    userId: string,
    categoryName: string,
    categoryType: 'income' | 'expense'
  ): Promise<CategoryType> {
    const { data, error } = await supabaseAdmin
      .from('category_types')
      .insert({
        user_id: userId,
        category_name: categoryName,
        category_type: categoryType,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category type: ${error.message}`);
    }

    return data;
  }

  static async deleteCategoryType(userId: string, categoryName: string): Promise<void> {
    // Don't allow deletion of default categories
    const { error } = await supabaseAdmin
      .from('category_types')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', categoryName)
      .eq('is_default', false); // Only delete non-default categories

    if (error) {
      throw new Error(`Failed to delete category type: ${error.message}`);
    }
  }

  // Get available categories from existing transactions AND category_types table
  static async getAvailableCategories(userId: string): Promise<string[]> {
    try {
      // Get categories from category_types table (both default and user-specific)
      const { data: categoryTypes, error: categoryTypesError } = await supabaseAdmin
        .from('category_types')
        .select('category_name')
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (categoryTypesError) {
        console.warn('Failed to get category types:', categoryTypesError.message);
      }

      // Get categories from existing transactions
      const { data: transactions, error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .select(`
          category,
          user_category,
          accounts!inner(user_id)
        `)
        .eq('accounts.user_id', userId);

      if (transactionsError) {
        console.warn('Failed to get transaction categories:', transactionsError.message);
      }

      const categories = new Set<string>();
      
      // Add categories from category_types table
      categoryTypes?.forEach(ct => {
        if (ct.category_name) categories.add(ct.category_name);
      });

      // Add categories from existing transactions
      transactions?.forEach(transaction => {
        if (transaction.user_category) categories.add(transaction.user_category);
        if (transaction.category) categories.add(transaction.category);
      });

      // Ensure we have at least the basic categories
      const basicCategories = [
        'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
        'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Store',
        'Internal Transfer', 'Income', 'Uncategorized'
      ];
      basicCategories.forEach(cat => categories.add(cat));

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting available categories:', error);
      // Return basic categories as fallback
      return [
        'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
        'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Store',
        'Internal Transfer', 'Income', 'Uncategorized'
      ];
    }
  }

  // Delete a category completely (from category_types and update transactions)
  static async deleteCategory(userId: string, categoryName: string): Promise<number> {
    try {
      // Get all transactions for this user with this category
      const transactions = await this.getTransactions(userId);
      const transactionsToUpdate = transactions.filter(tx => 
        this.getEffectiveCategory(tx) === categoryName
      );

      // Update each transaction to remove the category
      let updatedCount = 0;
      for (const transaction of transactionsToUpdate) {
        try {
          await this.updateTransactionCategory(
            transaction.id,
            userId,
            'Uncategorized',
            'manual'
          );
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update transaction ${transaction.id}:`, error);
        }
      }

      // Delete from category_types table (only user-created categories)
      try {
        await this.deleteCategoryType(userId, categoryName);
      } catch (error) {
        console.warn('Failed to delete from category_types:', error);
      }

      // Delete any categorization rules for this category
      try {
        const rules = await this.getCategorizationRules(userId);
        const rulesToDelete = rules.filter(rule => rule.category === categoryName);
        
        for (const rule of rulesToDelete) {
          await this.deleteCategorizationRule(rule.id);
        }
      } catch (error) {
        console.warn('Error deleting categorization rules:', error);
      }

      // Delete any internal transfer rules for this category
      try {
        const transferRules = await this.getInternalTransferRules(userId);
        const transferRulesToDelete = transferRules.filter(rule => rule.category === categoryName);
        
        for (const rule of transferRulesToDelete) {
          await this.deleteInternalTransferRule(rule.id);
        }
      } catch (error) {
        console.warn('Error deleting internal transfer rules:', error);
      }

      return updatedCount;
    } catch (error) {
      throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Internal transfer rules management
  static async getInternalTransferRules(userId: string): Promise<InternalTransferRule[]> {
    const { data, error } = await supabaseAdmin
      .from('internal_transfer_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get internal transfer rules: ${error.message}`);
    }

    return data || [];
  }

  static async createInternalTransferRule(
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    category: string,
    description?: string
  ): Promise<InternalTransferRule> {
    const { data, error } = await supabaseAdmin
      .from('internal_transfer_rules')
      .insert({
        user_id: userId,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        category,
        description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create internal transfer rule: ${error.message}`);
    }

    return data;
  }

  static async updateInternalTransferRule(
    ruleId: string,
    updates: Partial<Pick<InternalTransferRule, 'category' | 'description'>>
  ): Promise<InternalTransferRule> {
    const { data, error } = await supabaseAdmin
      .from('internal_transfer_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update internal transfer rule: ${error.message}`);
    }

    return data;
  }

  static async deleteInternalTransferRule(ruleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('internal_transfer_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      throw new Error(`Failed to delete internal transfer rule: ${error.message}`);
    }
  }

  // Detect and categorize internal transfers
  static async detectInternalTransfers(userId: string): Promise<number> {
    try {
      // Get all internal transfer rules for the user
      const rules = await this.getInternalTransferRules(userId);
      
      if (rules.length === 0) {
        return 0;
      }

      // Get user's accounts
      const accounts = await this.getAccounts(userId);
      const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

      let updatedCount = 0;

      // Check each rule
      for (const rule of rules) {
        // Find transactions that match this internal transfer pattern
        const { data: transactions, error: fetchError } = await supabaseAdmin
          .from('transactions')
          .select(`
            *,
            accounts!inner(user_id)
          `)
          .eq('accounts.user_id', userId)
          .eq('account_id', rule.from_account_id)
          .lt('amount', 0) // Outgoing transaction
          .is('user_category', null); // Not manually categorized

        if (fetchError) {
          console.error('Error fetching transactions for internal transfer detection:', fetchError);
          continue;
        }

        // For each outgoing transaction, look for matching incoming transaction
        for (const outgoingTx of transactions || []) {
          const { data: incomingTx, error: incomingError } = await supabaseAdmin
            .from('transactions')
            .select(`
              *,
              accounts!inner(user_id)
            `)
            .eq('accounts.user_id', userId)
            .eq('account_id', rule.to_account_id)
            .eq('amount', Math.abs(outgoingTx.amount)) // Matching positive amount
            .eq('date', outgoingTx.date) // Same date
            .single();

          if (!incomingError && incomingTx) {
            // Found matching internal transfer - categorize both transactions
            await this.updateTransactionCategory(
              outgoingTx.id,
              userId,
              rule.category,
              'rule'
            );

            await this.updateTransactionCategory(
              incomingTx.id,
              userId,
              rule.category,
              'rule'
            );

            updatedCount += 2;
          }
        }
      }

      return updatedCount;
    } catch (error) {
      throw new Error(`Failed to detect internal transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Internal Transfer Detection
  static async detectInternalTransfersAdvanced(userId: string): Promise<InternalTransfer[]> {
    try {
      const accounts = await this.getAccounts(userId);
      const accountIds = accounts.map(acc => acc.id);
      
      // Get recent transactions for analysis
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          accounts!inner(user_id)
        `)
        .eq('accounts.user_id', userId)
        .in('account_id', accountIds)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      const detectedTransfers: InternalTransfer[] = [];
      const processedTransactions = new Set<string>();

      for (const tx1 of transactions || []) {
        if (processedTransactions.has(tx1.id) || tx1.amount >= 0) continue;

        // Look for matching positive transaction
        for (const tx2 of transactions || []) {
          if (
            processedTransactions.has(tx2.id) ||
            tx2.amount <= 0 ||
            tx1.account_id === tx2.account_id ||
            Math.abs(tx1.amount) !== tx2.amount
          ) continue;

          // Check if transactions are within reasonable time window
          const timeDiff = Math.abs(new Date(tx1.date).getTime() - new Date(tx2.date).getTime());
          const maxTimeDiff = 24 * 60 * 60 * 1000; // 24 hours

          if (timeDiff <= maxTimeDiff) {
            // Calculate confidence based on various factors
            let confidence = 0.5;
            
            // Same day = higher confidence
            if (tx1.date === tx2.date) confidence += 0.3;
            
            // Exact amount match = higher confidence
            if (Math.abs(tx1.amount) === tx2.amount) confidence += 0.2;
            
            // Description patterns
            const desc1 = (tx1.description || '').toLowerCase();
            const desc2 = (tx2.description || '').toLowerCase();
            if (desc1.includes('overførsel') || desc1.includes('transfer') ||
                desc2.includes('overførsel') || desc2.includes('transfer')) {
              confidence += 0.3;
            }

            if (confidence >= 0.8) {
              // Save detected transfer
              const { data: transfer, error: transferError } = await supabaseAdmin
                .from('internal_transfers')
                .insert({
                  user_id: userId,
                  from_transaction_id: tx1.id,
                  to_transaction_id: tx2.id,
                  amount: Math.abs(tx1.amount),
                  transfer_date: tx1.date,
                  detection_confidence: confidence,
                  detection_method: 'advanced_algorithm'
                })
                .select()
                .single();

              if (!transferError && transfer) {
                detectedTransfers.push(transfer);
                processedTransactions.add(tx1.id);
                processedTransactions.add(tx2.id);

                // Update transaction categories
                await this.updateTransactionCategory(tx1.id, userId, 'Internal Transfer', 'rule');
                await this.updateTransactionCategory(tx2.id, userId, 'Internal Transfer', 'rule');
              }
              break;
            }
          }
        }
      }

      return detectedTransfers;
    } catch (error) {
      throw new Error(`Failed to detect internal transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Budget Management
  static async getBudgets(userId: string): Promise<Budget[]> {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get budgets: ${error.message}`);
    }

    return data || [];
  }

  static async createBudget(userId: string, budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .insert({
        ...budget,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create budget: ${error.message}`);
    }

    return data;
  }

  static async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }

    return data;
  }

  static async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('budgets')
      .update({ is_active: false })
      .eq('id', budgetId);

    if (error) {
      throw new Error(`Failed to delete budget: ${error.message}`);
    }
  }

  static async checkBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    try {
      const budgets = await this.getBudgets(userId);
      const transactions = await this.getTransactions(userId);
      const alerts: BudgetAlert[] = [];

      for (const budget of budgets) {
        const currentPeriodStart = this.getCurrentPeriodStart(budget.period_type, budget.start_date);
        const relevantTransactions = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          const txCategory = this.getEffectiveCategory(tx);
          return txDate >= currentPeriodStart && 
                 txCategory === budget.category && 
                 tx.amount < 0; // Only expenses
        });

        const totalSpent = relevantTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const percentageUsed = (totalSpent / budget.amount) * 100;
        const remaining = budget.amount - totalSpent;

        if (percentageUsed >= budget.alert_threshold * 100) {
          const alertType = percentageUsed >= 100 ? 'exceeded' : 'threshold_reached';
          const message = percentageUsed >= 100 
            ? `You've exceeded your ${budget.category} budget by ${(totalSpent - budget.amount).toFixed(2)} DKK`
            : `You've used ${percentageUsed.toFixed(1)}% of your ${budget.category} budget`;

          const { data: alert, error } = await supabaseAdmin
            .from('budget_alerts')
            .insert({
              user_id: userId,
              budget_id: budget.id,
              alert_type: alertType,
              message,
              amount_spent: totalSpent,
              amount_remaining: remaining,
              percentage_used: percentageUsed,
            })
            .select()
            .single();

          if (!error && alert) {
            alerts.push(alert);
          }
        }
      }

      return alerts;
    } catch (error) {
      throw new Error(`Failed to check budget alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static getCurrentPeriodStart(periodType: string, startDate: string): Date {
    const start = new Date(startDate);
    const now = new Date();

    switch (periodType) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Start of current week (Monday)
        return weekStart;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return start;
    }
  }

  // Goal Management
  static async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    const { data, error } = await supabaseAdmin
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('target_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get financial goals: ${error.message}`);
    }

    return data || [];
  }

  static async createFinancialGoal(userId: string, goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FinancialGoal> {
    const { data, error } = await supabaseAdmin
      .from('financial_goals')
      .insert({
        ...goal,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create financial goal: ${error.message}`);
    }

    return data;
  }

  static async updateGoalProgress(goalId: string, amount: number, source: string = 'manual', notes?: string): Promise<void> {
    // Add progress entry
    const { error: progressError } = await supabaseAdmin
      .from('goal_progress')
      .insert({
        goal_id: goalId,
        amount_added: amount,
        progress_date: new Date().toISOString().split('T')[0],
        source,
        notes,
      });

    if (progressError) {
      throw new Error(`Failed to add goal progress: ${progressError.message}`);
    }

    // Update goal current amount
    const { error: updateError } = await supabaseAdmin
      .rpc('update_goal_current_amount', {
        goal_id: goalId,
        amount_to_add: amount
      });

    if (updateError) {
      throw new Error(`Failed to update goal amount: ${updateError.message}`);
    }
  }

  // Subscription Management
  static async detectSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const transactions = await this.getTransactions(userId);
      const potentialSubscriptions = new Map<string, any[]>();

      // Group transactions by merchant and amount
      transactions.forEach(tx => {
        if (tx.amount >= 0) return; // Only expenses

        const merchant = tx.creditor_name || tx.debtor_name || 'Unknown';
        const amount = Math.abs(tx.amount);
        const key = `${merchant}_${amount}`;

        if (!potentialSubscriptions.has(key)) {
          potentialSubscriptions.set(key, []);
        }
        potentialSubscriptions.get(key)!.push(tx);
      });

      const detectedSubscriptions: Subscription[] = [];

      for (const [key, txs] of potentialSubscriptions) {
        if (txs.length < 2) continue; // Need at least 2 transactions

        const [merchant, amountStr] = key.split('_');
        const amount = parseFloat(amountStr);
        
        // Sort by date
        txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Check for regular intervals
        const intervals = [];
        for (let i = 1; i < txs.length; i++) {
          const prevDate = new Date(txs[i-1].date);
          const currDate = new Date(txs[i].date);
          const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
        }

        // Check if intervals are consistent (monthly = ~30 days, weekly = ~7 days)
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        let frequency: 'monthly' | 'weekly' | 'yearly' = 'monthly';
        let confidence = 0.5;

        if (Math.abs(avgInterval - 30) <= 5) {
          frequency = 'monthly';
          confidence = 0.8;
        } else if (Math.abs(avgInterval - 7) <= 2) {
          frequency = 'weekly';
          confidence = 0.8;
        } else if (Math.abs(avgInterval - 365) <= 30) {
          frequency = 'yearly';
          confidence = 0.7;
        }

        // Additional confidence factors
        const description = txs[0].description.toLowerCase();
        if (description.includes('spotify') || description.includes('netflix') || 
            description.includes('subscription') || description.includes('abonnement')) {
          confidence += 0.2;
        }

        if (confidence >= 0.7) {
          const nextPaymentDate = new Date(txs[txs.length - 1].date);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + avgInterval);

          const { data: subscription, error } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              user_id: userId,
              merchant_name: merchant,
              service_name: merchant, // Can be enhanced with service detection
              amount,
              frequency,
              next_payment_date: nextPaymentDate.toISOString().split('T')[0],
              detection_confidence: confidence,
              first_detected: new Date().toISOString().split('T')[0],
              last_payment_date: txs[txs.length - 1].date,
            })
            .select()
            .single();

          if (!error && subscription) {
            detectedSubscriptions.push(subscription);
          }
        }
      }

      return detectedSubscriptions;
    } catch (error) {
      throw new Error(`Failed to detect subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('amount', { ascending: false });

    if (error) {
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    return data || [];
  }

  // Achievement System
  static async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const [transactions, budgets, goals, existingAchievements] = await Promise.all([
        this.getTransactions(userId),
        this.getBudgets(userId),
        this.getFinancialGoals(userId),
        this.getUserAchievements(userId)
      ]);

      const awardedAchievements: UserAchievement[] = [];
      const existingAchievementIds = new Set(existingAchievements.map(ua => ua.achievement_id));

      // Check various achievement conditions
      const achievementChecks = [
        {
          condition: budgets.length >= 1,
          achievementName: 'First Budget',
          progressValue: budgets.length
        },
        {
          condition: budgets.length >= 3 && this.checkBudgetCompliance(userId, budgets, transactions, 3),
          achievementName: 'Budget Master',
          progressValue: 3
        },
        {
          condition: this.calculateTotalSavings(transactions) >= 1000,
          achievementName: 'Savings Starter',
          progressValue: this.calculateTotalSavings(transactions)
        },
        {
          condition: this.calculateTotalSavings(transactions) >= 10000,
          achievementName: 'Savings Hero',
          progressValue: this.calculateTotalSavings(transactions)
        },
        {
          condition: goals.some(g => g.current_amount >= g.target_amount),
          achievementName: 'Goal Getter',
          progressValue: goals.filter(g => g.current_amount >= g.target_amount).length
        }
      ];

      for (const check of achievementChecks) {
        if (check.condition) {
          // Get achievement details
          const { data: achievement, error } = await supabaseAdmin
            .from('achievements')
            .select('*')
            .eq('name', check.achievementName)
            .single();

          if (!error && achievement && !existingAchievementIds.has(achievement.id)) {
            // Award achievement
            const { data: userAchievement, error: awardError } = await supabaseAdmin
              .from('user_achievements')
              .insert({
                user_id: userId,
                achievement_id: achievement.id,
                progress_value: check.progressValue,
              })
              .select()
              .single();

            if (!awardError && userAchievement) {
              awardedAchievements.push(userAchievement);
            }
          }
        }
      }

      return awardedAchievements;
    } catch (error) {
      throw new Error(`Failed to check achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        *,
        achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user achievements: ${error.message}`);
    }

    return data || [];
  }

  private static calculateTotalSavings(transactions: Transaction[]): number {
    // This is a simplified calculation - could be enhanced based on specific criteria
    const totalIncome = transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return Math.max(0, totalIncome - totalExpenses);
  }

  private static async checkBudgetCompliance(userId: string, budgets: Budget[], transactions: Transaction[], months: number): Promise<boolean> {
    // Check if user stayed within budget for the specified number of months
    // This is a simplified implementation
    return budgets.length > 0; // Placeholder
  }

  // Financial Insights Generation
  static async generateFinancialInsights(userId: string): Promise<FinancialInsight[]> {
    try {
      const [transactions, budgets, subscriptions] = await Promise.all([
        this.getTransactions(userId),
        this.getBudgets(userId),
        this.getSubscriptions(userId)
      ]);

      const insights: Omit<FinancialInsight, 'id' | 'created_at'>[] = [];

      // Spending pattern insights
      const categorySpending = this.analyzeCategorySpending(transactions);
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 3);

      for (const [category, data] of topCategories) {
        if (data.amount > 1000) { // Only for significant categories
          insights.push({
            user_id: userId,
            insight_type: 'spending_pattern',
            title: `High ${category} Spending`,
            description: `You've spent ${data.amount.toFixed(2)} DKK on ${category} this month across ${data.transactions} transactions`,
            actionable_advice: `Consider setting a budget for ${category} to track and control spending`,
            potential_savings: data.amount * 0.15, // Suggest 15% savings
            confidence_score: 0.8,
            category,
            priority: 'medium',
            is_read: false,
            is_acted_upon: false,
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
          });
        }
      }

      // Subscription insights
      const totalSubscriptionCost = subscriptions.reduce((sum, sub) => {
        const monthlyAmount = sub.frequency === 'monthly' ? sub.amount : 
                             sub.frequency === 'yearly' ? sub.amount / 12 : 
                             sub.amount * 4.33; // weekly
        return sum + monthlyAmount;
      }, 0);

      if (totalSubscriptionCost > 500) {
        insights.push({
          user_id: userId,
          insight_type: 'saving_opportunity',
          title: 'High Subscription Costs',
          description: `Your subscriptions cost ${totalSubscriptionCost.toFixed(2)} DKK per month`,
          actionable_advice: 'Review your subscriptions and cancel unused ones',
          potential_savings: totalSubscriptionCost * 0.3,
          confidence_score: 0.9,
          category: 'Subscriptions',
          priority: 'high',
          is_read: false,
          is_acted_upon: false,
          valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
        });
      }

      // Save insights to database
      const savedInsights: FinancialInsight[] = [];
      for (const insight of insights) {
        const { data, error } = await supabaseAdmin
          .from('financial_insights')
          .insert(insight)
          .select()
          .single();

        if (!error && data) {
          savedInsights.push(data);
        }
      }

      return savedInsights;
    } catch (error) {
      throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static analyzeCategorySpending(transactions: Transaction[]): Record<string, {amount: number, transactions: number}> {
    const analysis: Record<string, {amount: number, transactions: number}> = {};
    
    transactions.forEach(tx => {
      if (tx.amount >= 0) return; // Only expenses
      
      const category = this.getEffectiveCategory(tx);
      if (!analysis[category]) {
        analysis[category] = { amount: 0, transactions: 0 };
      }
      analysis[category].amount += Math.abs(tx.amount);
      analysis[category].transactions += 1;
    });

    return analysis;
  }

  // User Preferences
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    return data;
  }

  static async createOrUpdateUserPreferences(userId: string, preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserPreferences> {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return data;
  }

  // Enhanced Merchant Recognition
  static async getEnhancedMerchantCategory(description: string, creditorName?: string, debtorName?: string): Promise<{category: string, confidence: number}> {
    try {
      // First try database lookup
      const merchantName = creditorName || debtorName || description;
      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .select('category, confidence_score')
        .or(`name.ilike.%${merchantName}%,aliases.cs.{${merchantName}}`)
        .single();

      if (!error && merchant) {
        return {
          category: merchant.category,
          confidence: merchant.confidence_score
        };
      }

      // Fallback to rule-based categorization
      return this.categorizeByRules(description, merchantName);
    } catch (error) {
      return this.categorizeByRules(description, creditorName || debtorName || '');
    }
  }

  private static categorizeByRules(description: string, merchantName: string): {category: string, confidence: number} {
    const desc = description.toLowerCase();
    const merchant = merchantName.toLowerCase();
    
    // Enhanced categorization with confidence scores
    const rules = [
      { patterns: ['netto', 'rema', 'bilka', 'føtex', 'irma', 'kvickly', 'lidl', 'aldi'], category: 'Groceries', confidence: 0.95 },
      { patterns: ['7-eleven', '7eleven', 'convenience'], category: 'Convenience Stores', confidence: 0.9 },
      { patterns: ['dsb', 'rejsekort', 'movia', 'transport'], category: 'Transport', confidence: 0.9 },
      { patterns: ['shell', 'q8', 'circle k', 'ok benzin', 'benzin'], category: 'Gas', confidence: 0.9 },
      { patterns: ['spotify', 'netflix', 'disney', 'hbo', 'streaming'], category: 'Entertainment', confidence: 0.95 },
      { patterns: ['restaurant', 'cafe', 'pizza', 'burger', 'mcdonalds'], category: 'Dining', confidence: 0.85 },
      { patterns: ['apotek', 'læge', 'tandlæge', 'hospital'], category: 'Healthcare', confidence: 0.9 },
      { patterns: ['tdc', 'yousee', 'telenor', '3dk'], category: 'Bills', confidence: 0.9 },
      { patterns: ['overførsel', 'transfer', 'fra konto', 'til konto'], category: 'Internal Transfer', confidence: 0.8 },
    ];

    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        if (desc.includes(pattern) || merchant.includes(pattern)) {
          return { category: rule.category, confidence: rule.confidence };
        }
      }
    }

    return { category: 'Uncategorized', confidence: 0.3 };
  }

  // Saving Challenges
  static async createSavingChallenge(userId: string, challengeType: string): Promise<SavingChallenge> {
    const challengeTemplates = {
      'no_spend_weekend': {
        name: 'No-Spend Weekend',
        description: 'Avoid all non-essential purchases this weekend',
        target_days: 2,
        difficulty: 'medium' as const,
        reward_points: 100
      },
      'cook_at_home': {
        name: 'Cook at Home Challenge',
        description: 'Cook all meals at home for one week',
        target_days: 7,
        difficulty: 'hard' as const,
        reward_points: 200
      },
      'coffee_challenge': {
        name: 'Skip the Coffee Shop',
        description: 'Make coffee at home instead of buying it for 5 days',
        target_days: 5,
        difficulty: 'easy' as const,
        reward_points: 75
      }
    };

    const template = challengeTemplates[challengeType as keyof typeof challengeTemplates];
    if (!template) {
      throw new Error('Invalid challenge type');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + template.target_days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from('saving_challenges')
      .insert({
        user_id: userId,
        challenge_type: challengeType,
        name: template.name,
        description: template.description,
        target_days: template.target_days,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        difficulty: template.difficulty,
        reward_points: template.reward_points,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create saving challenge: ${error.message}`);
    }

    return data;
  }

  static async getSavingChallenges(userId: string): Promise<SavingChallenge[]> {
    const { data, error } = await supabaseAdmin
      .from('saving_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get saving challenges: ${error.message}`);
    }

    return data || [];
  }
}
