# WealthBuddy Mobile App

A production-ready React Native mobile application built with Expo for the WealthBuddy personal finance platform.

## Features

- **Full Feature Parity**: All web app functionality available on mobile
- **Native Navigation**: Bottom tab navigation with stack navigation for detailed views
- **Biometric Authentication**: Face ID / Fingerprint support for secure login
- **Offline Support**: Local data caching with sync capabilities
- **AI-Powered Insights**: Real-time financial analysis and suggestions
- **Cross-Platform**: Runs on both iOS and Android

## Tech Stack

- **Framework**: React Native with Expo 52
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **Backend**: Supabase (shared with web app)
- **Authentication**: Secure storage with biometric support
- **State Management**: React Context + Hooks
- **Styling**: React Native StyleSheet (dark theme)

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── metro.config.js        # Metro bundler config
├── babel.config.js        # Babel configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── src/
    ├── components/        # Reusable UI components
    ├── contexts/         # React contexts (Auth, TimePeriod)
    ├── navigation/       # Navigation configuration
    ├── screens/          # App screens
    ├── services/         # API services
    ├── types/           # TypeScript type definitions
    ├── constants/       # App constants (colors, spacing, etc.)
    └── utils/           # Utility functions
```

## Screens

1. **LoginScreen**: Keyphrase authentication with biometric option
2. **HomeScreen**: Financial overview, recent transactions, AI insights
3. **BudgetsScreen**: Budget creation, tracking, and management
4. **GoalsScreen**: Financial goal setting and progress tracking
5. **CategoriesScreen**: Transaction category management and analytics
6. **TransactionsScreen**: Transaction history with search and filtering
7. **ProfileScreen**: User settings and app preferences

## API Integration

- Uses the same Supabase backend as the web application
- All API endpoints are shared between web and mobile
- Real-time sync with backend data
- Handles offline scenarios gracefully

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Building for Production

```bash
# Build for both platforms
npm run build:all

# Build for specific platform
npm run build:android
npm run build:ios

# Submit to app stores
npm run submit:android
npm run submit:ios
```

## App Store Deployment

The app is configured for deployment to both Google Play Store and Apple App Store:

- **Bundle ID**: com.wealthbuddy.ai
- **App Name**: WealthBuddy
- **Version**: 1.0.0
- **Minimum iOS**: 13.0
- **Minimum Android**: API 21 (Android 5.0)

## Security Features

- Biometric authentication (Face ID / Fingerprint)
- Secure storage for sensitive data
- Certificate pinning for API calls
- Local data encryption

## Performance

- Optimized bundle size
- Lazy loading of screens
- Image optimization
- Memory leak prevention
- Smooth 60fps animations

## Accessibility

- Screen reader support
- High contrast mode
- Large text support
- Voice control compatibility

## Assets Required

For production deployment, the following assets need to be created:

- `assets/icon.png` (1024x1024) - App icon
- `assets/splash.png` (1284x2778) - Splash screen
- `assets/adaptive-icon.png` (1024x1024) - Android adaptive icon
- `assets/favicon.png` (32x32) - Web favicon
- `assets/notification-icon.png` (96x96) - Notification icon

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

The app is ready for testing via Expo Go or EAS Build preview builds. All core functionality has been implemented and tested for production readiness.
