# Internal Transfer Management System

This document describes the internal transfer management system that allows users to automatically categorize transfers between their own bank accounts based on predefined rules.

## Overview

The internal transfer system helps users:
- **Detect transfers between their own accounts** (e.g., from checking to savings)
- **Automatically categorize these transfers** based on account relationships
- **Assign meaningful categories** like "Budget Money", "Car Fund", "Emergency Fund", etc.
- **Avoid double-counting** transfers in financial summaries

## Example Use Cases

- **Account 1 → Account 2**: Budget money transfers
- **Account 1 → Account 4**: Car fund transfers  
- **Checking → Savings**: Emergency fund
- **Main → Investment**: Investment transfers

## Database Schema

### Internal Transfer Rules Table

```sql
CREATE TABLE internal_transfer_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, from_account_id, to_account_id)
);
```

## API Endpoints

### 1. Get Internal Transfer Rules
```http
GET /api/internal-transfers?userId={userId}
```

**Response:**
```json
{
  "rules": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "from_account_id": "uuid",
      "to_account_id": "uuid", 
      "category": "Budget Money",
      "description": "Monthly budget allocation",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Create Internal Transfer Rule
```http
POST /api/internal-transfers
Content-Type: application/json

{
  "userId": "uuid",
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "category": "Budget Money",
  "description": "Monthly budget allocation"
}
```

### 3. Update Internal Transfer Rule
```http
PUT /api/internal-transfers
Content-Type: application/json

{
  "ruleId": "uuid",
  "category": "Emergency Fund",
  "description": "Updated description"
}
```

### 4. Delete Internal Transfer Rule
```http
DELETE /api/internal-transfers?ruleId={ruleId}
```

### 5. Detect Internal Transfers
```http
POST /api/internal-transfers/detect
Content-Type: application/json

{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "updatedCount": 12,
  "message": "Detected and categorized 12 internal transfer transactions"
}
```

## How Detection Works

The system detects internal transfers by:

1. **Getting all internal transfer rules** for the user
2. **Finding outgoing transactions** from the "from" account (negative amounts)
3. **Looking for matching incoming transactions** in the "to" account with:
   - Same absolute amount
   - Same date
   - Positive amount
4. **Categorizing both transactions** with the rule's category

### Detection Algorithm

```typescript
for (const rule of rules) {
  // Find outgoing transactions from source account
  const outgoingTransactions = await getTransactions({
    accountId: rule.from_account_id,
    amount: { lt: 0 }, // Negative amounts only
    userCategory: null // Not manually categorized
  });

  for (const outgoingTx of outgoingTransactions) {
    // Look for matching incoming transaction
    const incomingTx = await findTransaction({
      accountId: rule.to_account_id,
      amount: Math.abs(outgoingTx.amount), // Positive matching amount
      date: outgoingTx.date // Same date
    });

    if (incomingTx) {
      // Categorize both transactions
      await updateTransactionCategory(outgoingTx.id, rule.category);
      await updateTransactionCategory(incomingTx.id, rule.category);
    }
  }
}
```

## Usage Examples

### Setting Up Rules

1. **Create a rule for budget transfers:**
```javascript
const response = await fetch('/api/internal-transfers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    fromAccountId: 'checking-account-uuid',
    toAccountId: 'budget-account-uuid',
    category: 'Budget Money',
    description: 'Monthly budget allocation'
  })
});
```

2. **Create a rule for car fund:**
```javascript
const response = await fetch('/api/internal-transfers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    fromAccountId: 'checking-account-uuid',
    toAccountId: 'car-savings-uuid',
    category: 'Car Fund',
    description: 'Saving for new car'
  })
});
```

### Running Detection

```javascript
const response = await fetch('/api/internal-transfers/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid'
  })
});

const result = await response.json();
console.log(`Categorized ${result.updatedCount} transactions`);
```

## Integration with Transaction Sync

The internal transfer detection can be integrated into the transaction sync process:

```typescript
// After syncing transactions
await syncTransactions(userId);

// Detect and categorize internal transfers
await detectInternalTransfers(userId);

// Apply other categorization rules
await applyCategorizationRules(userId);
```

## Database Functions

The system includes several database functions in `DatabaseService`:

- `getInternalTransferRules(userId)` - Get all rules for a user
- `createInternalTransferRule(...)` - Create a new rule
- `updateInternalTransferRule(...)` - Update existing rule
- `deleteInternalTransferRule(ruleId)` - Delete a rule
- `detectInternalTransfers(userId)` - Run detection algorithm

## Benefits

1. **Automatic Categorization**: No manual work needed once rules are set up
2. **Meaningful Categories**: Transfers get proper categories instead of generic "Transfer"
3. **Financial Clarity**: Better understanding of money movement between accounts
4. **Audit Trail**: All categorization changes are logged
5. **Flexible Rules**: Easy to add, modify, or remove rules as needed

## Setup Instructions

1. **Run the schema file** in your Supabase SQL editor:
   ```sql
   -- Run internal-transfer-rules-schema.sql
   ```

2. **Set up your internal transfer rules** via the API or UI

3. **Run detection** manually or integrate into your sync process

4. **Monitor results** through the transaction category updates audit trail

## Troubleshooting

### Common Issues

1. **No transfers detected**: Check that rules exist and accounts have matching transactions
2. **Wrong categorization**: Verify rule setup and account IDs
3. **Duplicate categorization**: Ensure rules don't overlap or conflict

### Debugging

Check the transaction category updates table for audit trail:
```sql
SELECT * FROM transaction_category_updates 
WHERE user_id = 'your-user-id' 
AND update_reason = 'rule'
ORDER BY created_at DESC;
