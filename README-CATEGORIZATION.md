# WealthBuddy AI - Enhanced Categorization System

## 🎯 Overview

The WealthBuddy AI application now includes a comprehensive categorization system that allows users to:

1. **Manually edit transaction categories** with click-to-edit functionality
2. **Create custom categorization rules** based on keywords and patterns
3. **Bulk update multiple transactions** at once
4. **Apply rules automatically** to existing and new transactions
5. **Track categorization sources** (auto, manual, or rule-based)

## 🚀 New Features

### 1. Manual Category Management

#### Click-to-Edit Categories
- Click any category badge in the transactions table to edit it
- Dropdown shows all available categories
- Changes are saved immediately with audit trail
- Visual indicators show categorization source:
  - 🔧 Rule-based categorization
  - ✏️ Manual categorization
  - No icon = Auto categorization

#### Bulk Category Updates
- Select multiple transactions using checkboxes
- Click "Update X Categories" button
- Choose new category from dropdown
- All selected transactions updated at once

### 2. Smart Categorization Rules

#### Rule Types
- **Contains**: Keyword appears anywhere in transaction text
- **Starts with**: Transaction text begins with keyword
- **Ends with**: Transaction text ends with keyword
- **Exact match**: Transaction text exactly matches keyword

#### Rule Management
- Access via "Manage Rules" button in dashboard
- Add new rules with keyword, category, and rule type
- Delete existing rules
- Apply rules to existing transactions
- Rules are prioritized and processed in order

#### Example Rules
```
DSB → Transportation (contains)
7-eleven → Convenience Store (contains)
NETTO → Groceries (contains)
MobilePay → MobilePay (contains)
```

### 3. Enhanced Database Schema

#### New Tables
- **categorization_rules**: User-defined categorization rules
- **transaction_category_updates**: Audit trail of category changes

#### Enhanced Transactions Table
- `user_category`: Manual category override
- `category_source`: Source of categorization (auto/manual/rule)

## 🛠️ Technical Implementation

### API Endpoints

#### Category Management
- `GET /api/categories?userId={id}` - Get available categories
- `POST /api/categories` - Apply rules to existing transactions

#### Rule Management
- `GET /api/categories/rules?userId={id}` - Get user's rules
- `POST /api/categories/rules` - Create new rule
- `PUT /api/categories/rules` - Update existing rule
- `DELETE /api/categories/rules?ruleId={id}` - Delete rule

#### Transaction Updates
- `POST /api/categories/update` - Update single transaction category
- `PUT /api/categories/update` - Bulk update transaction categories

### Database Functions

#### Enhanced Categorization
```sql
categorize_transaction_enhanced(user_id, description, creditor_name, debtor_name)
```
- Checks user rules first (by priority)
- Falls back to default categorization logic
- Returns appropriate category

#### Category Updates with Audit Trail
```sql
update_transaction_category(transaction_id, user_id, new_category, update_reason)
```
- Updates transaction category
- Records change in audit table
- Tracks update reason (manual/rule/bulk)

#### Rule Application
```sql
apply_categorization_rules(user_id)
```
- Applies all user rules to existing transactions
- Only updates transactions without manual categories
- Returns count of updated transactions

## 🎨 User Interface

### Dashboard Enhancements

#### Transaction Table
- Checkbox column for bulk selection
- Editable category badges with visual indicators
- Color-coded categories by source
- Bulk update button when transactions selected

#### Rules Management Modal
- Add new rules form
- List of existing rules with delete option
- Apply rules to existing transactions button
- Rule type selection (contains/starts_with/ends_with/exact)

#### Category Selection
- Dropdown with all available categories
- Includes default categories plus user-created ones
- Sorted alphabetically for easy selection

### Visual Indicators

#### Category Badges
- **Blue**: Manual categorization (✏️)
- **Purple**: Rule-based categorization (🔧)
- **Gray**: Auto categorization (no icon)

#### Rule Types
- **Contains**: Most flexible, matches anywhere
- **Starts with**: Matches beginning of text
- **Ends with**: Matches end of text
- **Exact**: Precise matching only

## 📊 Usage Examples

### Creating Rules

1. **Transportation Rule**
   - Keyword: "DSB"
   - Category: "Transportation"
   - Type: "Contains"
   - Result: All transactions containing "DSB" → Transportation

2. **Grocery Rule**
   - Keyword: "NETTO"
   - Category: "Groceries"
   - Type: "Contains"
   - Result: All transactions containing "NETTO" → Groceries

3. **Convenience Store Rule**
   - Keyword: "7-eleven"
   - Category: "Convenience Store"
   - Type: "Contains"
   - Result: All transactions containing "7-eleven" → Convenience Store

### Manual Categorization

1. Click on any category badge in the transactions table
2. Select new category from dropdown
3. Category updates immediately
4. Change is recorded in audit trail
5. Badge shows ✏️ to indicate manual categorization

### Bulk Updates

1. Select multiple transactions using checkboxes
2. Click "Update X Categories" button
3. Choose new category from modal dropdown
4. All selected transactions updated simultaneously
5. Selection cleared automatically

## 🔧 Setup Instructions

### 1. Database Setup

Run the enhanced schema in your Supabase SQL editor:

```sql
-- First run the main schema (supabase-schema.sql)
-- Then run the enhanced schema (supabase-schema-enhanced.sql)
```

### 2. Environment Variables

Ensure your `.env.local` includes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Default Rules

The system includes default rules for common Danish patterns:
- DSB → Transportation
- 7-eleven → Convenience Store
- NETTO → Groceries
- MobilePay → MobilePay

## 🎯 Benefits

### For Users
- **Control**: Manual override of any categorization
- **Efficiency**: Bulk operations for multiple transactions
- **Automation**: Rules reduce manual categorization work
- **Transparency**: Clear indication of categorization source

### For Developers
- **Audit Trail**: Complete history of category changes
- **Flexibility**: Multiple rule types for different patterns
- **Performance**: Efficient database functions and indexing
- **Scalability**: User-specific rules and categories

## 🚀 Future Enhancements

### Planned Features
1. **Rule Priority Management**: Drag-and-drop rule ordering
2. **Category Analytics**: Spending breakdown by category
3. **Smart Suggestions**: AI-powered rule recommendations
4. **Import/Export**: Share rules between users
5. **Advanced Patterns**: Regex support for complex rules

### Performance Optimizations
1. **Rule Caching**: Cache frequently used rules
2. **Batch Processing**: Optimize bulk operations
3. **Background Jobs**: Async rule application
4. **Smart Indexing**: Additional database indexes

This enhanced categorization system provides users with powerful tools to organize their financial data while maintaining the automated convenience of the original system.
