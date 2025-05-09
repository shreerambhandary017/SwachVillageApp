import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/ThemeContext';
import { API_CONFIG } from '../utils/config';
import { getAuthToken, logoutUser } from '../utils/auth';

// Extended user type definition
type ExtendedUser = {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  created_at?: string;
  profile_completed?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, theme, setTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(
    isSystemTheme ? 'system' : (theme as 'light' | 'dark')
  );

  useEffect(() => {
    loadUserData();
    
    // Update document title to fix the localhost:8081/profile issue
    if (typeof document !== 'undefined') {
      document.title = 'Profile - Swach Village';
    }
  }, []);

  useEffect(() => {
    setCurrentTheme(isSystemTheme ? 'system' : (theme as 'light' | 'dark'));
  }, [theme, isSystemTheme]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        router.replace('/(auth)/sign-in');
        return;
      }
      
      console.log(`Fetching profile from: ${API_CONFIG.API_URL}/consumer/profile`);
      
      const response = await fetch(`${API_CONFIG.API_URL}/consumer/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      
      // Handle HTTP status codes properly
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed or expired');
        // Clear invalid auth data
        await logoutUser();
        router.replace('/(auth)/sign-in');
        return;
      }
      
      // Get the response data
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Successfully loaded user profile from API');
        
        // Map API response to ExtendedUser type
        const userProfile: ExtendedUser = {
          id: data.user.id,
          name: data.user.name || '',
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          role: data.user.role || 'consumer',
          is_verified: data.user.is_verified || false,
          created_at: data.user.created_at || new Date().toISOString(),
          profile_completed: data.user.profile_completed || false
        };
        
        setUser(userProfile);
        
        // Update stored user data
        await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      } else {
        console.error('Failed to load profile:', data.message || 'Unknown error');
        setError(data.message || 'Failed to load profile. Please try again.');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to connect to server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for any additional utility functions needed in the future
  // This section was cleaned up to remove the aggressive emergency logout function 
  // that was interfering with the standard logout flow

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(newTheme);
    // Fix the TypeScript error by using the correct type
    setTheme(newTheme === 'system' ? 'system' : newTheme);
  };

  const handleRefresh = () => {
    loadUserData();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme === 'dark' ? colors.surface : colors.background }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme === 'dark' ? colors.surface : colors.background }]} 
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {user && (
          <View style={[styles.userInfoContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ fontSize: 36, color: colors.primary }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userTextContainer}>
                <Text style={[styles.nameText, { color: colors.text }]}>
                  {user.full_name || user.name || 'User'}
                </Text>
                <Text style={[styles.emailText, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
                {user.phone && (
                  <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                    {user.phone}
                  </Text>
                )}
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={user.is_verified ? "checkmark-circle" : "time-outline"} 
                    size={16} 
                    color={user.is_verified ? '#4CAF50' : '#FFC107'} 
                  />
                  <Text 
                    style={[
                      styles.statusText, 
                      { color: user.is_verified ? '#4CAF50' : '#FFC107' }
                    ]}
                  >
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Appearance Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          </View>
          
          <View style={styles.themeOptionsContainer}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { 
                  backgroundColor: colors.background,
                  borderColor: currentTheme === 'light' ? colors.primary : colors.border
                },
                currentTheme === 'light' && styles.selectedTheme
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="sunny-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.themeText, { color: colors.text }]}>Light Mode</Text>
              {currentTheme === 'light' && (
                <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { 
                  backgroundColor: colors.background,
                  borderColor: currentTheme === 'dark' ? colors.primary : colors.border
                },
                currentTheme === 'dark' && styles.selectedTheme
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="moon-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.themeText, { color: colors.text }]}>Dark Mode</Text>
              {currentTheme === 'dark' && (
                <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { 
                  backgroundColor: colors.background,
                  borderColor: currentTheme === 'system' ? colors.primary : colors.border
                },
                currentTheme === 'system' && styles.selectedTheme
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.themeText, { color: colors.text }]}>System Default</Text>
              {currentTheme === 'system' && (
                <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="apps" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.text }]}>App Version</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Account Type</Text>
            <View style={[styles.accountTypeBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.accountTypeText, { color: colors.primary }]}>
                {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Consumer'}
              </Text>
            </View>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Account Created</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {formatDate(user?.created_at)}
            </Text>
          </View>
        </View>
        
        {/* Contact Support */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
            <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
          </View>
          
          <TouchableOpacity style={styles.supportRow}>
            <View style={styles.supportIconContainer}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>Help Center</Text>
              <Text style={[styles.supportDescription, { color: colors.textSecondary }]}>FAQ and user guides</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportRow}>
            <View style={styles.supportIconContainer}>
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>Contact Us</Text>
              <Text style={[styles.supportDescription, { color: colors.textSecondary }]}>Get in touch with our team</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button - DIRECT IMPLEMENTATION */}
       <TouchableOpacity
                 style={styles.logoutButton}
                 onPress={handleLogout}
               >
                 <Text style={styles.logoutButtonText}>
                   Log Out
                 </Text>
               </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  userInfoContainer: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTextContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeOptionsContainer: {
    marginTop: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTheme: {
    borderWidth: 2,
  },
  themeText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginRight: 12,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
    marginLeft: 20,
    marginRight: 20
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  }
});
