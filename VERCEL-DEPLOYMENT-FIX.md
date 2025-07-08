# Vercel Deployment Fix for NEXTAUTH_URL Error

## Problem
The app shows "NEXTAUTH_URL not configured" error when trying to connect a bank on Vercel.

## Root Cause
The code was incorrectly using `NEXTAUTH_URL` environment variable to construct callback URLs for Nordigen bank connections, even though the app doesn't use NextAuth.js.

## Solution Applied
Updated both the connect and callback routes to use Vercel's automatic `VERCEL_URL` environment variable with fallbacks:

**In `/src/app/api/nordigen/connect/route.ts`:**
```typescript
// Get the base URL for callbacks - use VERCEL_URL on Vercel, fallback to NEXTAUTH_URL or localhost
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL || 'http://localhost:3000';
```

**In `/src/app/api/nordigen/callback/route.ts`:**
```typescript
// Get the base URL for redirects - use VERCEL_URL on Vercel, fallback to NEXTAUTH_URL or localhost
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL || 'http://localhost:3000';
```

This ensures both the initial bank connection and the callback redirect use the correct URLs.

## Vercel Environment Variables Setup

### Required Environment Variables on Vercel:

1. **NORDIGEN_SECRET_ID** - Your Nordigen API Secret ID
2. **NORDIGEN_SECRET_KEY** - Your Nordigen API Secret Key
3. **OPENAI_API_KEY** - Your OpenAI API key
4. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
5. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
6. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key

### Optional Environment Variables:
- **NEXTAUTH_URL** - Only needed if you want to override the automatic URL detection
- **NEXTAUTH_SECRET** - Can be set for future use if NextAuth is added

## How Vercel URL Detection Works

1. **Production**: Vercel automatically sets `VERCEL_URL` to your domain (e.g., `wealthbuddy-ai.vercel.app`)
2. **Preview**: Vercel sets `VERCEL_URL` to the preview deployment URL
3. **Local Development**: Falls back to `NEXTAUTH_URL` or `http://localhost:3000`

## Steps to Deploy on Vercel

1. **Set Environment Variables**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all the required variables listed above

2. **Deploy**:
   - Push your code to GitHub
   - Vercel will automatically deploy
   - The `VERCEL_URL` will be automatically available

3. **Test Bank Connection**:
   - Try connecting a bank account
   - The callback URL will now be correctly constructed as `https://your-domain.vercel.app/api/nordigen/callback`

## Verification

After deployment, you can verify the fix by:
1. Opening the app on Vercel
2. Trying to connect a bank account
3. The error should no longer appear
4. Check the Vercel function logs to see the correct callback URL being used

## Local Development

For local development, ensure your `.env.local` file has:
```
NEXTAUTH_URL=http://localhost:3000
```

This will be used as the fallback when `VERCEL_URL` is not available.
