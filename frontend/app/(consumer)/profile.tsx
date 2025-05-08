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
import { getUserData, logoutUser } from '../utils/auth';

// User type definition
type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  profile_completed: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, theme, setTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      
      if (!userData || !userData.id) {
        throw new Error('User information not found');
      }
      
      const response = await fetch(`${API_CONFIG.API_URL}/users/${userData.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data.user || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Unable to load profile. Please try again later.');
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
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const setSystemTheme = () => {
    setTheme('system');
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your account information
          </Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchUserProfile}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : user ? (
          <View style={styles.profileContainer}>
            <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
              <View style={styles.profileAvatarContainer}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitials}>
                    {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileName}>{user.full_name}</Text>
              <Text style={styles.profileRole}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
            </View>
            
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{user.phone}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(user.created_at)}</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.primary} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.themeToggle, { backgroundColor: colors.background }]}
                  onPress={toggleTheme}
                >
                  <View style={[
                    styles.themeToggleHandle,
                    { 
                      backgroundColor: colors.primary,
                      transform: [{ translateX: theme === 'dark' ? 20 : 0 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.systemThemeButton,
                  { 
                    backgroundColor: isSystemTheme ? colors.primary + '20' : 'transparent',
                    borderColor: colors.border
                  }
                ]}
                onPress={setSystemTheme}
              >
                <Text style={[
                  styles.systemThemeText,
                  { color: isSystemTheme ? colors.primary : colors.textSecondary }
                ]}>
                  Use System Theme
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.error }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="person-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Profile not available
            </Text>
          </View>
        )}
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
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 24,
    marginBottom: 16,
  },
  profileAvatarContainer: {
    marginBottom: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  profileName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 123, 0, 0.1)',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  themeToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  themeToggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  systemThemeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  systemThemeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
