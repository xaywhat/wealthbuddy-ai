# WealthBuddy Mobile App Setup

This document explains how to build and deploy the WealthBuddy mobile app using Capacitor.

## 📱 Mobile App Overview

The WealthBuddy mobile app is built using:
- **Next.js** for the web frontend
- **Capacitor** for native mobile functionality
- **Android Studio** for building APKs

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Android Studio installed
- Java Development Kit (JDK) 8 or higher

### Building the Mobile App

1. **Build the web assets for mobile:**
   ```bash
   npm run build:mobile
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Build APK in Android Studio:**
   - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
   - The APK will be generated in `android/app/build/outputs/apk/debug/`

## 📋 Available Scripts

- `npm run build:mobile` - Build static assets for mobile
- `npm run cap:sync` - Sync web assets with native platforms
- `npm run cap:open` - Open native IDE
- `npm run android` - Build and open Android project
- `npm run build:android` - Full build pipeline for Android

## 🔧 Configuration

### Capacitor Configuration (`capacitor.config.ts`)
```typescript
{
  appId: 'com.wealthbuddy.app',
  appName: 'WealthBuddy',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f59e0b',
      showSpinner: false
    }
  }
}
```

### Next.js Mobile Configuration
The app automatically detects mobile builds using the `CAPACITOR_BUILD` environment variable and:
- Enables static export
- Optimizes images for mobile
- Configures trailing slashes for proper routing

## 🌐 API Configuration

Since the mobile app runs as static files, it needs to connect to your deployed backend API. Update the production API URL in `src/lib/config.ts`:

```typescript
export const config = {
  getApiUrl: (endpoint: string) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
      return `https://your-production-api.vercel.app${endpoint}`;
    }
    return endpoint;
  }
};
```

## 📱 App Features

The mobile app includes:
- ✅ Bank account connection via Nordigen
- ✅ Transaction viewing and categorization
- ✅ AI-powered spending analysis
- ✅ Financial insights and recommendations
- ✅ Responsive mobile-first design
- ✅ Offline-capable static assets

## 🔐 Security Considerations

- API calls are made over HTTPS
- Sensitive data is handled securely
- Bank connections use PSD2-compliant APIs
- No sensitive data is stored locally

## 🚀 Deployment

### Development APK
1. Build using the steps above
2. Install on device via USB debugging
3. Test all functionality

### Production Release
1. Update API URLs to production endpoints
2. Build release APK in Android Studio
3. Sign with release keystore
4. Upload to Google Play Store

## 🛠 Troubleshooting

### Common Issues

**Build fails with ESLint errors:**
- The mobile build script uses `--no-lint` to bypass ESLint
- Fix ESLint errors for production builds

**API calls fail in mobile app:**
- Ensure production API URL is correctly configured
- Check CORS settings on your backend
- Verify HTTPS is properly configured

**App crashes on startup:**
- Check Android Studio logs
- Verify all required permissions are set
- Ensure Capacitor plugins are properly installed

### Debugging
- Use Chrome DevTools for web debugging
- Use Android Studio logcat for native debugging
- Enable USB debugging for device testing

## 📁 Project Structure

```
wealthbuddy-ai/
├── android/                 # Native Android project
├── out/                     # Static build output for mobile
├── src/                     # Next.js source code
├── capacitor.config.ts      # Capacitor configuration
├── next.config.ts          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## 🔄 Development Workflow

1. Develop features in Next.js web app
2. Test in browser first
3. Build mobile version: `npm run build:mobile`
4. Sync and test in Android Studio
5. Deploy web version and mobile APK

## 📞 Support

For issues with:
- **Next.js/Web**: Check Next.js documentation
- **Capacitor**: Check Capacitor documentation
- **Android**: Check Android Studio documentation
- **Bank API**: Check Nordigen documentation

---

**Note**: Remember to update the production API URL in `src/lib/config.ts` before building for production!
