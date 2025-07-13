import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TimePeriodProvider } from '@/contexts/TimePeriodContext';
import { COLORS } from '@/constants';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Hide splash screen once auth is loaded
    const hideSplashScreen = async () => {
      if (!isLoading) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    };

    hideSplashScreen();
  }, [isLoading]);

  // Handle deep links for bank authentication callbacks
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      
      if (url.includes('wealthbuddy://callback')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        
        if (error) {
          Alert.alert('Bank Authentication Failed', error);
        } else if (success) {
          Alert.alert('Bank Connected!', 'Your bank account has been successfully connected. Data will sync automatically.');
        }
      }
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.bgPrimary 
      }}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#1a1a1a" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TimePeriodProvider>
          <AppContent />
        </TimePeriodProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
