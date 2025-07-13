import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/contexts/AuthContext';
import { TimePeriodProvider } from '@/contexts/TimePeriodContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TimePeriodProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" backgroundColor="#1a1a1a" />
          </NavigationContainer>
        </TimePeriodProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
