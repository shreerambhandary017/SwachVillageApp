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
  }, []);

  useEffect(() => {
    setCurrentTheme(isSystemTheme ? 'system' : (theme as 'light' | 'dark'));
  }, [theme, isSystemTheme]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // First try to get user profile from the API
      try {
        const response = await fetch(`${API_CONFIG.API_URL}/consumer/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Ensure data.user conforms to our ExtendedUser type
          const userProfile: ExtendedUser = {
            id: data.user.id,
            name: data.user.name || data.user.username || '',
            full_name: data.user.full_name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            role: data.user.role || 'consumer',
            is_verified: Boolean(data.user.is_verified),
            created_at: data.user.created_at || new Date().toISOString(),
            profile_completed: Boolean(data.user.profile_completed)
          };
          setUser(userProfile);
          return;
        }
      } catch (apiError) {
        console.log('API fetch failed, falling back to local storage');
      }
      
      // Fallback to local storage if API fails
      const userData = await getUserData();
      if (!userData) {
        throw new Error('User data not available');
      }
      
      // Ensure the stored user data matches our ExtendedUser type
      const userFromStorage: ExtendedUser = {
        id: userData.id,
        name: userData.name || '',
        full_name: userData.full_name || userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'consumer',
        is_verified: Boolean(userData.is_verified),
        created_at: userData.created_at || new Date().toISOString(),
        profile_completed: Boolean(userData.profile_completed)
      };
      
      setUser(userFromStorage);
    } catch (error: any) {
      console.error('Error loading user data:', error);
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
              await logoutUser();
              // Force a small delay to ensure AsyncStorage updates complete
              setTimeout(() => {
                router.replace('/(auth)/sign-in');
              }, 100);
            } catch (error) {
              console.error('Logout error:', error);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        {user && (
          <View style={[styles.userInfoContainer, { backgroundColor: colors.primary }]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="white" />
              </View>
              <Text style={[styles.nameText, { color: 'white' }]}>{user.name}</Text>
              <Text style={[styles.emailText, { color: 'rgba(255, 255, 255, 0.8)' }]}>{user.email}</Text>
              {user.phone && (
                <Text style={[styles.phoneText, { color: 'rgba(255, 255, 255, 0.8)' }]}>{user.phone}</Text>
              )}
              <View style={styles.statusContainer}>
                <Ionicons
                  name={user.is_verified ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={user.is_verified ? 'white' : 'yellow'}
                />
                <Text style={[styles.statusText, { color: 'white' }]}>
                  {user.is_verified ? 'Verified Account' : 'Unverified Account'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              currentTheme === 'light' ? styles.selectedTheme : null, 
              { borderColor: colors.primary }
            ]}
            onPress={() => handleThemeChange('light')}
          >
            <Ionicons 
              name="sunny" 
              size={24} 
              color={currentTheme === 'light' ? colors.primary : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.themeText, 
                { color: currentTheme === 'light' ? colors.primary : colors.text }
              ]}
            >
              Light
            </Text>
            {currentTheme === 'light' && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              currentTheme === 'dark' ? styles.selectedTheme : null, 
              { borderColor: colors.primary }
            ]}
            onPress={() => handleThemeChange('dark')}
          >
            <Ionicons 
              name="moon" 
              size={24} 
              color={currentTheme === 'dark' ? colors.primary : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.themeText, 
                { color: currentTheme === 'dark' ? colors.primary : colors.text }
              ]}
            >
              Dark
            </Text>
            {currentTheme === 'dark' && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              currentTheme === 'system' ? styles.selectedTheme : null, 
              { borderColor: colors.primary }
            ]}
            onPress={() => handleThemeChange('system')}
          >
            <Ionicons 
              name="phone-portrait" 
              size={24} 
              color={currentTheme === 'system' ? colors.primary : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.themeText, 
                { color: currentTheme === 'system' ? colors.primary : colors.text }
              ]}
            >
              System
            </Text>
            {currentTheme === 'system' && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>App Version</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Account Type</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Consumer'}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Account Created</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {formatDate(user?.created_at)}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
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
