import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  TextInput, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { loginUser, UserRole } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';
import ThemeToggleIcon from '../components/ThemeToggleIcon';
import { THEME_SIZING } from '../utils/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSignIn = async () => {
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await loginUser({
        identifier,
        password,
        role
      });
      
      // Navigate to the appropriate dashboard
      if (role === 'business') {
        router.push('/(business)');
      } else {
        router.push('/(consumer)');
      }
    } catch (error: any) {
      setError(error.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Define gradient colors as specific color values to satisfy TypeScript
  const gradientColors = theme === 'dark' 
    ? ['#121212', '#1E1E1E', '#121212'] as const
    : ['#FFE0C4', '#FFF6ED', '#FFFFFF'] as const;
    
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeBubble1} />
        <View style={[styles.decorativeBubble2, { backgroundColor: colors.primaryLight }]} />
      </LinearGradient>
      
      <SafeAreaView style={styles.safeArea}>
        {/* Theme Toggle Icon in top-right corner */}
        <View style={styles.themeToggle}>
          <ThemeToggleIcon color={colors.primary} size={24} />
        </View>
        
        {/* Main content container with fixed height */}
        <View style={styles.mainContent}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              horizontal={false}
              alwaysBounceVertical={false}
              alwaysBounceHorizontal={false}
              keyboardShouldPersistTaps="handled"
              accessible={true}
              accessibilityRole="none"              
            >
            {/* Card Container with Blur Effect */}
            <BlurView 
              intensity={theme === 'dark' ? 40 : 30}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={[styles.blurContainer, { 
                backgroundColor: theme === 'dark' 
                  ? 'rgba(30, 30, 30, 0.75)' 
                  : 'rgba(255, 255, 255, 0.75)' 
              }]}
            >
              {/* Logo and Header */}
              <View style={styles.headerContainer}>
                {/* Multi-layered logo background matching splash screen */}
                <View style={[styles.logoOuter, { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 123, 0, 0.1)' }]}>
                  <View style={[styles.logoMiddle, { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 123, 0, 0.15)' }]}>
                    <LinearGradient
                      colors={theme === 'dark' ? ['#FFFFFF', '#FFFFFF'] : ['#FFFFFF', '#FFFFFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.logoContainer}>
                      <View style={styles.logoInnerShadow}>
                        <Image
                          source={require('../../assets/images/swach_logo.png')}
                          style={styles.logo}
                          contentFit="contain"
                        />
                      </View>
                    </LinearGradient>
                  </View>
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Welcome to Swach Village
                </Text>
              </View>
              
              {/* Form */}
              <View style={styles.form}>
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Email / Phone</Text>
                  <View style={[styles.inputWrapper, { 
                    backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: colors.border
                  }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder="Enter your email or phone"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      cursorColor={colors.primary}
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                  <View style={[styles.inputWrapper, { 
                    backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: colors.border
                  }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      cursorColor={colors.primary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                      <Ionicons 
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={[styles.sectionLabel, { color: colors.text }]}>I am a:</Text>
                <View style={styles.roleToggleContainer}>                  
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { 
                        borderColor: colors.border,
                        backgroundColor: role === 'consumer' ? colors.primary : theme === 'dark' ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)' 
                      }
                    ]}
                    onPress={() => setRole('consumer')}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={role === 'consumer' ? 'white' : colors.primary} 
                    />
                    <Text 
                      style={[
                        styles.roleButtonText,
                        { color: role === 'consumer' ? 'white' : colors.text }
                      ]}
                    >
                      Consumer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { 
                        borderColor: colors.border,
                        backgroundColor: role === 'business' ? colors.primary : theme === 'dark' ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)' 
                      }
                    ]}
                    onPress={() => setRole('business')}
                  >
                    <Ionicons 
                      name="business-outline" 
                      size={20} 
                      color={role === 'business' ? 'white' : colors.primary} 
                    />
                    <Text 
                      style={[
                        styles.roleButtonText,
                        { color: role === 'business' ? 'white' : colors.text }
                      ]}
                    >
                      Business
                    </Text>
                  </TouchableOpacity>                 
                </View>
                
                <TouchableOpacity 
                  style={[styles.signInButton, { backgroundColor: colors.primary }]} 
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.signUpContainer}>
                  <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                    <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  // Gradient Background
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // Decorative Elements
  decorativeBubble1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 123, 0, 0.1)',
    top: -50,
    right: -80,
  },
  decorativeBubble2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 100,
    left: -50,
    opacity: 0.2,
  },
  // Safe Area and Main Layout
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    overflow: 'hidden',
  },
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Theme Toggle
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  // Blur Container
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: '100%',
    maxWidth: 500,
  },
  // Header Section
  headerContainer: {
    alignItems: 'center',
    marginTop: THEME_SIZING.spacing.m,
    marginBottom: THEME_SIZING.spacing.l,
  },
  // Multi-layered logo styling matching splash screen
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMiddle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  logoInnerShadow: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Form Elements
  form: {
    width: '100%',
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
  },
  passwordToggle: {
    padding: 8,
  },
  sectionLabel: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '500',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME_SIZING.spacing.m,
    borderRadius: THEME_SIZING.borderRadius.medium,
    borderWidth: 1,
    marginHorizontal: THEME_SIZING.spacing.xs,
  },
  roleButtonText: {
    fontSize: THEME_SIZING.fontSize.m,
    fontWeight: '500',
    marginLeft: THEME_SIZING.spacing.xs,
  },
  signInButton: {
    backgroundColor: '#FF7B00',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME_SIZING.spacing.xl,
    marginBottom: THEME_SIZING.spacing.xl,
  },
  signUpText: {
    fontSize: THEME_SIZING.fontSize.m,
  },
  signUpLink: {
    fontSize: THEME_SIZING.fontSize.m,
    fontWeight: '600',
  },
});