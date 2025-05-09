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
import { getUserData, logoutUser, getAuthToken } from '../utils/auth';

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
          is_verified: Boolean(data.user.is_verified),
          created_at: data.user.created_at || new Date().toISOString(),
          profile_completed: Boolean(data.user.profile_completed)
        };
        
        // Save updated data to storage
        await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
        
        setUser(userProfile);
      } else {
        console.warn('API returned unsuccessful response:', data);
        // Only fall back to local storage for server errors, not auth errors
        if (response.status >= 500) {
          // Fallback to local storage for server errors
          const userData = await getUserData();
          
          if (userData) {
            console.log('Using cached user data from local storage');
            setUser(userData as ExtendedUser);
          } else {
            throw new Error(data.message || 'Failed to load profile');
          }
        } else {
          throw new Error(data.message || 'Failed to load profile');
        }
      }
    } catch (error: any) {
      console.error('Error loading user data:', error.message);
      setError(error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
              console.log('Profile: Starting logout process...');
              
              // First clear AsyncStorage directly
              const keys = await AsyncStorage.getAllKeys();
              console.log('Profile: Found storage keys:', keys);
              
              // Clear all auth-related data
              await logoutUser();
              
              console.log('Profile: Auth data cleared, redirecting to sign-in');
              
              // Force navigation with a reset to clear history
              router.navigate('/(auth)/sign-in');
              
              // Force a reload as a fallback if redirect doesn't work
              setTimeout(() => {
                console.log('Profile: Forcing navigation again...');
                router.replace('/(auth)/sign-in');
              }, 500);
            } catch (error) {
              console.error('Profile: Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(newTheme);
    setTheme(newTheme);
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
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {user && (
          <View style={[styles.userInfoContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={[styles.nameText, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.emailText, { color: colors.textSecondary }]}>{user.email}</Text>
                {user.phone && (
                  <Text style={[styles.phoneText, { color: colors.textSecondary }]}>{user.phone}</Text>
                )}
                <View style={styles.statusContainer}>
                  <Ionicons
                    name={user.is_verified ? 'shield-checkmark' : 'alert-circle'}
                    size={16}
                    color={user.is_verified ? colors.success : colors.warning}
                  />
                  <Text style={[styles.statusText, { color: user.is_verified ? colors.success : colors.warning }]}>
                    {user.is_verified ? 'Verified Account' : 'Verification Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          </View>
          
          <View style={styles.themeOptionsContainer}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                currentTheme === 'light' ? [styles.selectedTheme, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }] : { borderColor: colors.border }
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <View style={styles.themeIconContainer}>
                <Ionicons 
                  name="sunny" 
                  size={24} 
                  color={currentTheme === 'light' ? colors.primary : colors.textSecondary} 
                />
              </View>
              <Text 
                style={[
                  styles.themeText, 
                  { color: currentTheme === 'light' ? colors.primary : colors.text }
                ]}
              >
                Light
              </Text>
              {currentTheme === 'light' && 
                <View style={[styles.checkmarkContainer, {backgroundColor: colors.primary}]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              }
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                currentTheme === 'dark' ? [styles.selectedTheme, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }] : { borderColor: colors.border }
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <View style={styles.themeIconContainer}>
                <Ionicons 
                  name="moon" 
                  size={24} 
                  color={currentTheme === 'dark' ? colors.primary : colors.textSecondary} 
                />
              </View>
              <Text 
                style={[
                  styles.themeText, 
                  { color: currentTheme === 'dark' ? colors.primary : colors.text }
                ]}
              >
                Dark
              </Text>
              {currentTheme === 'dark' && 
                <View style={[styles.checkmarkContainer, {backgroundColor: colors.primary}]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              }
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                currentTheme === 'system' ? [styles.selectedTheme, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }] : { borderColor: colors.border }
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <View style={styles.themeIconContainer}>
                <Ionicons 
                  name="phone-portrait" 
                  size={24} 
                  color={currentTheme === 'system' ? colors.primary : colors.textSecondary} 
                />
              </View>
              <Text 
                style={[
                  styles.themeText, 
                  { color: currentTheme === 'system' ? colors.primary : colors.text }
                ]}
              >
                System
              </Text>
              {currentTheme === 'system' && 
                <View style={[styles.checkmarkContainer, {backgroundColor: colors.primary}]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              }
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

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + 'DD' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="white" style={{marginRight: 8}} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 4,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
