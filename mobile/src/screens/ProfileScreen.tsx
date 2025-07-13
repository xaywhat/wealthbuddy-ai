import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { nordigenAPI, syncAPI, accountsAPI } from '@/services/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants';

const ProfileScreen = () => {
  const { user, logout, biometricEnabled, enableBiometric, disableBiometric } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingBankAuth, setPendingBankAuth] = useState(false);

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Listen for app state changes to detect return from bank authentication
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && pendingBankAuth) {
        console.log('App became active after bank authentication, syncing data...');
        setPendingBankAuth(false);
        // Automatically sync data when returning from bank authentication
        handleSyncData(true); // Auto-retry with delays
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [pendingBankAuth]);

  const loadAccountsData = async () => {
    if (!user) return;

    try {
      setIsLoadingAccounts(true);
      const [accountsResult, statusResult] = await Promise.all([
        accountsAPI.getAccounts(user.id).catch(() => ({ success: false, accounts: [] })),
        syncAPI.getSyncStatus(user.id).catch(() => ({ success: false, status: null }))
      ]);

      const accountsData = accountsResult?.success ? accountsResult.accounts : 
                          accountsResult?.accounts || accountsResult || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);

      const statusData = statusResult?.success ? statusResult.status : 
                         statusResult?.status || statusResult;
      setSyncStatus(statusData);
    } catch (error) {
      console.error('Error loading accounts data:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      setIsLoadingBanks(true);
      setShowBankSelection(true);
      
      // Load available banks
      const institutionsResponse = await nordigenAPI.getInstitutions('DK');
      console.log('Institutions response:', institutionsResponse);
      
      // Handle wrapped response format
      const institutions = institutionsResponse?.institutions || institutionsResponse || [];
      
      if (!Array.isArray(institutions) || institutions.length === 0) {
        Alert.alert('Error', 'No Danish banks available. Please try again later.');
        setShowBankSelection(false);
        return;
      }

      setAvailableBanks(institutions);
    } catch (error: any) {
      console.error('Error loading banks:', error);
      Alert.alert('Error', 'Failed to load banks. Please try again.');
      setShowBankSelection(false);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const mapInstitutionIdToBankKey = (institutionId: string): string | null => {
    const bankMapping: Record<string, string> = {
      'DANSKE_ANDELSKASSERS_BANK_DANBDK22': 'danske_andelskassers',
      'DANSKEBANK_DABADKKK': 'danske_bank',
      'DANSKEBANK_BUSINESS_DABADKKK': 'danske_bank',
      'NORDEA_NDEADKKK': 'nordea',
      'NORDEA_BUSINESS_NDEADKKK': 'nordea',
      'NORDEA_CORPORATE_NDEADKKK': 'nordea',
      'JYSKEBANK_JYBADKKK': 'jyske',
      'JYSKEBANK_CORP_JYBADKKK': 'jyske',
      'SYDBANK_SYBKDK22': 'sydbank',
      'SYDBANK_CORP_SYBKDK22': 'sydbank',
      'ARBEJDERNES_LANDSBANK_ALBADKKK': 'arbejdernes',
    };
    
    return bankMapping[institutionId] || null;
  };

  const handleSelectBank = async (bank: any) => {
    if (!user || isConnecting) return;

    try {
      setIsConnecting(true);
      console.log('Selected institution:', bank);
      
      // Map institution ID to bank key
      const bankKey = mapInstitutionIdToBankKey(bank.id);
      
      if (!bankKey) {
        Alert.alert('Error', 'This bank is not supported yet. Please try another bank.');
        return;
      }
      
      console.log('Mapped to bank key:', bankKey);
      
      // Create connection with bank key
      const connectionResult = await nordigenAPI.connect(user.id, bankKey);
      console.log('Connection result:', connectionResult);
      
      if (connectionResult?.success && connectionResult.authUrl) {
        setShowBankSelection(false);
        
        // Set pending flag to trigger auto-sync when returning from bank
        setPendingBankAuth(true);
        
        // Automatically open the bank authentication URL
        try {
          await Linking.openURL(connectionResult.authUrl);
          Alert.alert(
            'Complete Authentication',
            'After completing bank authentication, return to this app and the data will sync automatically.',
            [
              { 
                text: 'I\'ll return to the app', 
                onPress: () => {
                  // Start periodic check for when user returns
                  const checkInterval = setInterval(() => {
                    console.log('Checking if user returned to app...');
                    handleSyncData();
                    clearInterval(checkInterval);
                  }, 3000);
                  
                  // Clear the interval after 30 seconds
                  setTimeout(() => clearInterval(checkInterval), 30000);
                }
              }
            ]
          );
        } catch (linkingError) {
          console.error('Failed to open URL:', linkingError);
          Alert.alert(
            'Bank Connection Created',
            `Please visit this URL to complete setup: ${connectionResult.authUrl}`,
            [
              { 
                text: 'Copy Link', 
                onPress: () => {
                  console.log('Link copied:', connectionResult.authUrl);
                }
              },
              { text: 'OK' }
            ]
          );
        }
      } else {
        Alert.alert('Error', connectionResult?.error || 'Failed to create bank connection');
      }
    } catch (error: any) {
      console.error('Bank connection error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to connect to bank';
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCloseBankSelection = () => {
    setShowBankSelection(false);
    setAvailableBanks([]);
  };

  const handleSyncData = async (isAutoRetry = false) => {
    if (!user || isSyncing) return;

    try {
      setIsSyncing(true);
      
      // Add a small delay for auto-sync to allow bank auth to complete
      if (isAutoRetry) {
        console.log('Waiting for bank authentication to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }
      
      const result = await syncAPI.syncData(user.id);
      
      if (result?.success) {
        Alert.alert('Success', 'Bank connected and data synchronized successfully!');
        loadAccountsData(); // Reload data
      } else {
        // If sync fails but it's an auto-retry, try one more time after delay
        if (isAutoRetry) {
          console.log('First sync failed, retrying in 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
          
          const retryResult = await syncAPI.syncData(user.id);
          if (retryResult?.success) {
            Alert.alert('Success', 'Bank connected and data synchronized successfully!');
            loadAccountsData();
          } else {
            console.log('Sync still failing, will try manual approach');
            Alert.alert('Bank Connected', 'Your bank has been connected. Please use the Sync Data button in a few minutes to load your data.');
          }
        } else {
          Alert.alert('Error', result?.message || 'Failed to sync data');
        }
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      
      if (isAutoRetry) {
        // For auto-retry, don't show error but suggest manual sync
        Alert.alert('Bank Connected', 'Your bank has been connected. Please tap "Sync Data" in a few minutes to load your financial data.');
      } else {
        Alert.alert('Error', 'Failed to sync data. Please try again in a few minutes.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      await disableBiometric();
    } else {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={COLORS.textPrimary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.keyphrase}</Text>
              <Text style={styles.userEmail}>Authenticated</Text>
            </View>
          </View>
        </View>

        {/* Bank Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Connections</Text>
          
          {isLoadingAccounts ? (
            <View style={[styles.settingItem, { justifyContent: 'center' }]}>
              <ActivityIndicator size="small" color={COLORS.accentBlue} />
              <Text style={[styles.settingSubtitle, { marginLeft: SPACING.sm }]}>
                Loading accounts...
              </Text>
            </View>
          ) : accounts.length > 0 ? (
            <>
              {accounts.map((account, index) => (
                <View key={index} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name="card" 
                      size={24} 
                      color={COLORS.accentGreen} 
                      style={styles.settingIcon}
                    />
                    <View>
                      <Text style={styles.settingTitle}>{account.name}</Text>
                      <Text style={styles.settingSubtitle}>
                        {account.currency} {account.balance?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accentGreen} />
                </View>
              ))}
              
              <TouchableOpacity style={styles.settingItem} onPress={() => handleSyncData(false)} disabled={isSyncing}>
                <View style={styles.settingLeft}>
                  {isSyncing ? (
                    <ActivityIndicator 
                      size={24} 
                      color={COLORS.accentBlue} 
                      style={styles.settingIcon}
                    />
                  ) : (
                    <Ionicons 
                      name="refresh" 
                      size={24} 
                      color={COLORS.accentBlue} 
                      style={styles.settingIcon}
                    />
                  )}
                  <View>
                    <Text style={styles.settingTitle}>
                      {isSyncing ? 'Syncing...' : 'Sync Data'}
                    </Text>
                    <Text style={styles.settingSubtitle}>
                      {syncStatus?.last_sync ? 
                        `Last sync: ${new Date(syncStatus.last_sync).toLocaleDateString()}` :
                        'Refresh your financial data'
                      }
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.settingItem} onPress={handleConnectBank}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name="add-circle" 
                  size={24} 
                  color={COLORS.accentBlue} 
                  style={styles.settingIcon}
                />
                <View>
                  <Text style={styles.settingTitle}>Connect Bank Account</Text>
                  <Text style={styles.settingSubtitle}>Add your first bank connection</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={toggleBiometric}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="finger-print" 
                size={24} 
                color={COLORS.accentBlue} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Biometric Authentication</Text>
                <Text style={styles.settingSubtitle}>
                  {biometricEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={biometricEnabled ? 'toggle' : 'toggle-outline'} 
              size={24} 
              color={biometricEnabled ? COLORS.accentGreen : COLORS.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="information-circle" 
                size={24} 
                color={COLORS.accentBlue} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="shield-checkmark" 
                size={24} 
                color={COLORS.accentBlue} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>View our privacy policy</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="document-text" 
                size={24} 
                color={COLORS.accentBlue} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Terms of Service</Text>
                <Text style={styles.settingSubtitle}>View our terms</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color={COLORS.accentRed} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bank Selection Modal */}
      {showBankSelection && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Bank</Text>
              <TouchableOpacity onPress={handleCloseBankSelection}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            
            {isLoadingBanks ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.accentBlue} />
                <Text style={styles.modalLoadingText}>Loading banks...</Text>
              </View>
            ) : (
              <ScrollView style={styles.bankList}>
                {availableBanks.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankItem,
                      isConnecting && { opacity: 0.5 }
                    ]}
                    onPress={() => handleSelectBank(bank)}
                    disabled={isConnecting}
                  >
                    <View style={styles.bankInfo}>
                      <View style={styles.bankIcon}>
                        <Ionicons name="business" size={24} color={COLORS.accentBlue} />
                      </View>
                      <View style={styles.bankDetails}>
                        <Text style={styles.bankName}>{bank.name}</Text>
                        <Text style={styles.bankSubtitle}>
                          {bank.transaction_total_days} days of history
                        </Text>
                      </View>
                    </View>
                    {isConnecting ? (
                      <ActivityIndicator size="small" color={COLORS.accentBlue} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    padding: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
  },
  section: {
    marginBottom: SPACING['3xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  userCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  settingItem: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.lg,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  signOutButton: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  signOutText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accentRed,
    marginLeft: SPACING.sm,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  modalLoading: {
    padding: SPACING['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  bankList: {
    maxHeight: 400,
    paddingHorizontal: SPACING['2xl'],
  },
  bankItem: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bankSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen;
