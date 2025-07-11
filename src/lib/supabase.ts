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
}
