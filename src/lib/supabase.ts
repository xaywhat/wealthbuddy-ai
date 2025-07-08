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

export interface SyncLog {
  id: string;
  user_id: string;
  last_sync: string;
  status: 'success' | 'error' | 'in_progress';
  error_message?: string;
  created_at: string;
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
    // Use the database function for proper audit trail
    const { error } = await supabaseAdmin.rpc('update_transaction_category', {
      p_transaction_id: transactionId,
      p_user_id: userId,
      p_new_category: newCategory,
      p_update_reason: updateReason,
    });

    if (error) {
      throw new Error(`Failed to update transaction category: ${error.message}`);
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
    // Use the database function to apply rules to existing transactions
    const { data, error } = await supabaseAdmin.rpc('apply_categorization_rules', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to apply categorization rules: ${error.message}`);
    }

    return data || 0;
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

  // Get available categories from existing transactions
  static async getAvailableCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        category,
        user_category,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId);

    if (error) {
      throw new Error(`Failed to get available categories: ${error.message}`);
    }

    const categories = new Set<string>();
    
    // Add default categories
    const defaultCategories = [
      'Groceries', 'Transportation', 'Dining', 'Shopping', 'Bills', 
      'Entertainment', 'Healthcare', 'MobilePay', 'Convenience Store',
      'Internal Transfer', 'Income', 'Other'
    ];
    defaultCategories.forEach(cat => categories.add(cat));

    // Add categories from existing transactions
    data?.forEach(transaction => {
      if (transaction.user_category) categories.add(transaction.user_category);
      if (transaction.category) categories.add(transaction.category);
    });

    return Array.from(categories).sort();
  }
}
