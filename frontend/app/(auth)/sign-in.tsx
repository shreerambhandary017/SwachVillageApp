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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { loginUser, UserRole } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';
import ThemeSwitch from '../components/ThemeSwitch';
import { THEME_SIZING } from '../utils/theme';
import { TextInput, ActivityIndicator } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.themeSwitch}>
              <ThemeSwitch />
            </View>
      <View style={styles.headerContainer}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Image
            source={require('../../assets/images/swach_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome to Swach Village
        </Text>
      </View>
      
      <View style={styles.form}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email / Phone</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter your email or phone"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>
        </View>
        
        <Text style={[styles.sectionLabel, { color: colors.text }]}>I am a:</Text>
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              { borderColor: colors.border },
              role === 'business' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setRole('business')}
          >
            <Ionicons 
              name="business-outline" 
              size={20} 
              color={role === 'business' ? 'white' : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.roleButtonText,
                { color: colors.text },
                role === 'business' && { color: 'white' }
              ]}
            >
              Business
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.roleButton,
              { borderColor: colors.border },
              role === 'consumer' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setRole('consumer')}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={role === 'consumer' ? 'white' : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.roleButtonText,
                { color: colors.text },
                role === 'consumer' && { color: 'white' }
              ]}
            >
              Consumer
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.signUpContainer}>
        <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  themeSwitch: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: THEME_SIZING.spacing.xl,
    marginBottom: THEME_SIZING.spacing.l,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  errorContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: THEME_SIZING.fontSize.s,
    fontWeight: '500',
    marginBottom: THEME_SIZING.spacing.s,
    marginTop: THEME_SIZING.spacing.m,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME_SIZING.spacing.l,
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