import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { authAPI } from '@/services/api';
import { STORAGE_KEYS } from '@/constants';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  login: (keyphrase: string, enableBiometric?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user data exists
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Check biometric status
      const biometricStatus = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      setBiometricEnabled(biometricStatus === 'true');
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (keyphrase: string, enableBiometric = false): Promise<boolean> => {
    try {
      const response = await authAPI.login(keyphrase);
      
      if (response.success) {
        const userData = response.user;
        setUser(userData);
        
        // Store user data
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        
        // Handle biometric setup
        if (enableBiometric) {
          const biometricSuccess = await enableBiometricAuth();
          if (biometricSuccess) {
            await SecureStore.setItemAsync('userKeyphrase', keyphrase);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      
      // Clear all stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.BIOMETRIC_ENABLED,
      ]);
      
      // Clear secure store
      await SecureStore.deleteItemAsync('userKeyphrase');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const enableBiometricAuth = async (): Promise<boolean> => {
    try {
      // Check if biometric is available
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isAvailable) {
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return false;
      }

      // Test biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for WealthBuddy',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      setBiometricEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      await SecureStore.deleteItemAsync('userKeyphrase');
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (!biometricEnabled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access WealthBuddy',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        const storedKeyphrase = await SecureStore.getItemAsync('userKeyphrase');
        if (storedKeyphrase) {
          return await login(storedKeyphrase);
        }
      }

      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    biometricEnabled,
    login,
    logout,
    enableBiometric: enableBiometricAuth,
    disableBiometric,
    authenticateWithBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
