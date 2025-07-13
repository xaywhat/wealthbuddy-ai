import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants';

const LoginScreen = () => {
  const [keyphrase, setKeyphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const { login, biometricEnabled, authenticateWithBiometric } = useAuth();

  useEffect(() => {
    if (biometricEnabled) {
      handleBiometricLogin();
    }
  }, [biometricEnabled]);

  const handleBiometricLogin = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (!success) {
        Alert.alert('Authentication Failed', 'Please try again or use your keyphrase.');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    }
  };

  const handleLogin = async () => {
    if (!keyphrase.trim()) {
      Alert.alert('Error', 'Please enter your keyphrase');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(keyphrase, showBiometricOption);
      
      if (!success) {
        Alert.alert('Login Failed', 'Invalid keyphrase. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>WealthBuddy</Text>
            <Text style={styles.subtitle}>Your Personal Finance Assistant</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Enter your keyphrase</Text>
            <TextInput
              style={styles.input}
              value={keyphrase}
              onChangeText={setKeyphrase}
              placeholder="Your keyphrase"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Biometric Option */}
            <TouchableOpacity
              style={styles.biometricOption}
              onPress={() => setShowBiometricOption(!showBiometricOption)}
            >
              <Ionicons
                name={showBiometricOption ? 'checkbox' : 'square-outline'}
                size={20}
                color={COLORS.accentBlue}
              />
              <Text style={styles.biometricText}>
                Enable biometric authentication
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Biometric Login Button */}
            {biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Ionicons name="finger-print" size={24} color={COLORS.accentBlue} />
                <Text style={styles.biometricButtonText}>
                  Use Biometric Authentication
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure access to your financial data
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['5xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING['5xl'],
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: SPACING.lg,
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  biometricText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  loginButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
  },
  biometricButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.accentBlue,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default LoginScreen;
