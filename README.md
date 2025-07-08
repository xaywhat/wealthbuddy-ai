# WealthBuddy AI - Personal Finance App with Data Persistence

A comprehensive personal finance application that connects to Danish banks via Nordigen API, stores data in Supabase, and provides AI-powered spending insights.

## 🚀 Features

- **Keyphrase Authentication**: Simple login system for testing (use "test" to login)
- **Bank Integration**: Connect to Danish banks via Nordigen (PSD2 compliant)
- **Data Persistence**: All bank data stored in Supabase database
- **Smart Sync**: Intelligent data synchronization to avoid rate limits
- **AI Analysis**: OpenAI-powered spending insights and recommendations
- **Transaction Categorization**: Automatic categorization with Danish-specific rules
- **Dashboard**: Real-time view of accounts, transactions, and sync status

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

### Backend
- **Next.js API Routes** for server-side logic
- **Supabase** for database and real-time features
- **Nordigen API** for bank connectivity
- **OpenAI API** for transaction analysis

### Database Schema
- `users` - User management with keyphrase auth
- `bank_connections` - Track bank requisitions
- `accounts` - Store account details and balances
- `transactions` - Store transaction history with auto-categorization
- `sync_logs` - Track sync status and errors

## 📋 Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account
- Nordigen API credentials
- OpenAI API key

### 2. Environment Configuration

Create `.env.local` with the following variables:

```env
# Nordigen API Configuration
NORDIGEN_SECRET_ID=your_nordigen_secret_id
NORDIGEN_SECRET_KEY=your_nordigen_secret_key

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Supabase Database Setup

1. Create a new Supabase project
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables, indexes, and functions

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Authentication

The app uses a simple keyphrase-based authentication system for testing:

1. Go to `/login`
2. Enter "test" as the keyphrase
3. The system will automatically create a user if it doesn't exist

## 🏦 Bank Connection Flow

1. **Login** with keyphrase "test"
2. **Select Bank** from the list of Danish banks
3. **Connect** - Creates requisition and saves to database
4. **Authenticate** - Redirected to bank's authentication page
5. **Callback** - Returns to app with connection status
6. **Sync Data** - Fetches and stores account/transaction data

## 📊 Data Synchronization

### Smart Sync Strategy
- **Cached Data**: Shows immediately from database
- **Background Sync**: Updates data when older than 6 hours
- **Manual Sync**: Force refresh button available
- **Rate Limiting**: 2-3 second delays between API calls
- **Error Handling**: Comprehensive error logging and recovery

### Sync Process
1. Check last sync time
2. Create sync log entry
3. Fetch data from Nordigen with rate limiting
4. Store accounts and transactions in database
5. Update sync log with results

## 🤖 AI Features

### Transaction Analysis
- **Spending Patterns**: Identifies trends and habits
- **Category Insights**: Breaks down spending by category
- **Savings Opportunities**: Suggests areas to reduce spending
- **Personalized Recommendations**: Tailored advice based on data

### Auto-Categorization
Transactions are automatically categorized using Danish-specific rules:
- **Groceries**: Netto, Rema, Bilka, etc.
- **Convenience Stores**: 7-Eleven, kiosks
- **Transport**: DSB, Metro, Rejsekort
- **Bills**: Utilities, insurance, phone
- **MobilePay**: Mobile payment transactions
- **And more...**

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Keyphrase login

### Data Management
- `GET /api/data/accounts?userId=X` - Get cached accounts
- `GET /api/data/transactions?userId=X` - Get cached transactions
- `GET /api/data/sync-status?userId=X` - Get sync status
- `POST /api/data/sync` - Force data synchronization

### Nordigen Integration
- `POST /api/nordigen/connect` - Create bank connection
- `POST /api/nordigen/accounts` - Fetch account data
- `GET /api/nordigen/callback` - Handle bank auth callback

### AI Analysis
- `POST /api/ai-analysis` - Analyze transactions with AI

## 🔧 Rate Limiting Solutions

### Nordigen API Limits
- **Token Management**: Automatic refresh with 50-minute cache
- **Request Delays**: 2-3 seconds between API calls
- **Retry Logic**: Exponential backoff for 429 errors
- **Queue System**: Serialized API requests

### Database Optimization
- **Upsert Operations**: Prevent duplicate data
- **Indexed Queries**: Fast data retrieval
- **Batch Operations**: Efficient bulk inserts

## 📱 User Interface

### Login Page (`/login`)
- Simple keyphrase input
- Automatic user creation
- Redirects to dashboard

### Main Page (`/`)
- Bank connection interface
- Transaction display with categorization
- AI insights and recommendations

### Dashboard (`/dashboard`)
- Account overview with balances
- Sync status and controls
- Transaction history from database
- Manual sync functionality

## 🚨 Error Handling

### Nordigen Errors
- **Rate Limiting**: Automatic retry with delays
- **Token Expiry**: Automatic refresh
- **Connection Failures**: User-friendly error messages

### Database Errors
- **Connection Issues**: Graceful fallbacks
- **Constraint Violations**: Proper error handling
- **Sync Failures**: Detailed error logging

## 🔄 Development Workflow

### Testing the System
1. Start with fresh database (run schema)
2. Login with "test" keyphrase
3. Connect to a Danish bank (use sandbox if available)
4. Complete bank authentication
5. Verify data sync and storage
6. Test manual sync functionality
7. Check AI analysis results

### Monitoring
- Check sync logs in database
- Monitor API rate limits
- Review error messages in console
- Verify data consistency

## 🚀 Deployment Considerations

### Environment Variables
- Ensure all API keys are properly set
- Use production Supabase instance
- Configure proper NEXTAUTH_URL

### Database
- Enable Row Level Security policies
- Set up proper indexes for performance
- Configure backup strategies

### Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API usage and costs
- Track sync success rates

## 🔒 Security

### Data Protection
- All bank connections use PSD2-compliant APIs
- No sensitive bank credentials stored
- Encrypted data transmission

### Authentication
- Simple keyphrase system for testing
- Can be extended to proper auth (NextAuth.js ready)
- User data isolation in database

## 📈 Future Enhancements

- **Real Authentication**: Replace keyphrase with proper auth
- **Multi-User Support**: Full user management system
- **Advanced Analytics**: More sophisticated AI insights
- **Budget Planning**: Goal setting and tracking
- **Export Features**: PDF reports, CSV exports
- **Mobile App**: React Native companion app

## 🐛 Troubleshooting

### Common Issues

1. **Rate Limiting Errors**
   - Wait 24 hours for limits to reset
   - Check token cache file
   - Verify API credentials

2. **Database Connection Issues**
   - Check Supabase credentials
   - Verify network connectivity
   - Review RLS policies

3. **Sync Failures**
   - Check sync logs table
   - Verify bank connection status
   - Review error messages

### Debug Mode
Enable detailed logging by checking browser console and server logs.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in database
3. Verify environment configuration
4. Test with fresh database setup

---

**Note**: This is a development/testing application. For production use, implement proper authentication, security measures, and error handling according to your requirements.
